import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { addScan } from '../../scans/myScans'
import { fakeStore, record, renderScreen } from '../test-helpers'
import { Details } from './Details'

vi.mock('../../scans/myScans', () => ({ addScan: vi.fn().mockResolvedValue(undefined) }))

const user = userEvent.setup()

async function fillForm() {
  await user.type(await screen.findByLabelText('Product name'), 'Lotion')
  await user.type(screen.getByLabelText('Brand'), 'Acme')
  await user.click(screen.getByLabelText('Cosmetic'))
}

async function fillAndSubmit() {
  await fillForm()
  await user.click(screen.getByRole('button', { name: 'Save and see result' }))
}

const renderDetails = (store = fakeStore()) =>
  renderScreen(<Details />, { route: '/details', path: '/details', draft: ['Water'], store })

test('details: an empty draft redirects home', async () => {
  renderScreen(<Details />, { route: '/details', path: '/details', draft: [] })
  expect(await screen.findByTestId('where')).toHaveTextContent('/')
})

test('details: a likely-same product prompts before saving; "Yes" opens the saved record and saves nothing', async () => {
  const store = fakeStore([record({ id: 'old', ingredients: ['water'] })])
  renderDetails(store)
  await fillAndSubmit()
  expect(await screen.findByText('Is this the same as Acme Lotion?')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Yes, show saved result' }))
  expect(screen.getByTestId('where')).toHaveTextContent('/result/old')
  expect(store.save).not.toHaveBeenCalled()
})

test('details: "No, save as new" saves and opens the new result', async () => {
  const store = fakeStore([record({ id: 'old', ingredients: ['water'] })])
  renderDetails(store)
  await fillAndSubmit()
  await user.click(await screen.findByRole('button', { name: 'No, save as new' }))
  expect(store.save).toHaveBeenCalledWith(
    expect.objectContaining({
      name: 'Lotion',
      brand: 'Acme',
      type: 'cosmetic',
      barcode: null,
      ingredients: ['Water'],
      referenceVersion: 'v-test',
    }),
  )
  expect(await screen.findByTestId('where')).toHaveTextContent('/result/id-2')
  expect(addScan).toHaveBeenCalledWith('id-2')
})

test('details: a failed save shows an alert and stays on the page', async () => {
  const store = fakeStore()
  store.save.mockRejectedValueOnce(new Error('disk full'))
  renderDetails(store)
  await fillAndSubmit()
  expect(await screen.findByRole('alert')).toHaveTextContent('disk full')
  expect(screen.getByLabelText('Product name')).toBeInTheDocument()
})

test('details: submitting twice in the same tick saves once', async () => {
  const store = fakeStore()
  renderDetails(store)
  await fillForm()
  const form = screen.getByRole('button', { name: 'Save and see result' }).closest('form')!
  fireEvent.submit(form)
  fireEvent.submit(form)
  expect(await screen.findByTestId('where')).toHaveTextContent('/result/id-1')
  expect(store.save).toHaveBeenCalledTimes(1)
})

test('details: double-clicking "No, save as new" saves once', async () => {
  const store = fakeStore([record({ id: 'old', ingredients: ['water'] })])
  renderDetails(store)
  await fillAndSubmit()
  const no = await screen.findByRole('button', { name: 'No, save as new' })
  fireEvent.click(no)
  fireEvent.click(no)
  expect(await screen.findByTestId('where')).toHaveTextContent('/result/id-2')
  expect(store.save).toHaveBeenCalledTimes(1)
})

test('details: after a rejected save the button works again', async () => {
  const store = fakeStore()
  store.save.mockRejectedValueOnce(new Error('disk full'))
  renderDetails(store)
  await fillAndSubmit()
  await screen.findByRole('alert')
  const button = screen.getByRole('button', { name: 'Save and see result' })
  expect(button).toBeEnabled()
  await user.click(button)
  expect(await screen.findByTestId('where')).toHaveTextContent('/result/id-1')
  expect(store.save).toHaveBeenCalledTimes(2)
})

test('details: a same-name product with a different list offers to save the newer version', async () => {
  const store = fakeStore([record({ id: 'old', ingredients: ['Water', 'Formaldehyde'] })])
  renderDetails(store)
  await fillAndSubmit()
  expect(await screen.findByText('A saved version of Acme Lotion has different ingredients.')).toBeInTheDocument()
  expect(screen.queryByText('Is this the same as Acme Lotion?')).not.toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Save this as the newer version' }))
  expect(store.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Lotion', brand: 'Acme', ingredients: ['Water'] }))
  expect(await screen.findByTestId('where')).toHaveTextContent('/result/id-2')
  expect(addScan).toHaveBeenCalledWith('id-2')
})

test('details: "Show the saved version" opens the old record and saves nothing', async () => {
  const store = fakeStore([record({ id: 'old', ingredients: ['Water', 'Formaldehyde'] })])
  renderDetails(store)
  await fillAndSubmit()
  await user.click(await screen.findByRole('button', { name: 'Show the saved version' }))
  expect(screen.getByTestId('where')).toHaveTextContent('/result/old')
  expect(store.save).not.toHaveBeenCalled()
})

test('details: double-clicking "Save this as the newer version" saves once', async () => {
  const store = fakeStore([record({ id: 'old', ingredients: ['Formaldehyde'] })])
  renderDetails(store)
  await fillAndSubmit()
  const newer = await screen.findByRole('button', { name: 'Save this as the newer version' })
  fireEvent.click(newer)
  fireEvent.click(newer)
  expect(await screen.findByTestId('where')).toHaveTextContent('/result/id-2')
  expect(store.save).toHaveBeenCalledTimes(1)
})

test.each([
  ['the same list', ['water'], 'Is this the same as Acme Lotion?'],
  ['a different list', ['Formaldehyde'], 'A saved version of Acme Lotion has different ingredients.'],
])('details: with %s, "Change details" returns to the filled-in form without saving', async (_label, saved, prompt) => {
  const store = fakeStore([record({ id: 'old', ingredients: saved })])
  renderDetails(store)
  await fillAndSubmit()
  await screen.findByText(prompt)
  await user.click(screen.getByRole('button', { name: 'Change details' }))
  expect(screen.queryByText(prompt)).not.toBeInTheDocument()
  expect(screen.getByLabelText('Product name')).toHaveValue('Lotion')
  expect(screen.getByLabelText('Brand')).toHaveValue('Acme')
  expect(screen.getByLabelText('Cosmetic')).toBeChecked()
  await user.clear(screen.getByLabelText('Product name'))
  await user.type(screen.getByLabelText('Product name'), 'Lotion Plus')
  await user.click(screen.getByRole('button', { name: 'Save and see result' }))
  expect(await screen.findByTestId('where')).toHaveTextContent('/result/id-2')
  expect(store.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Lotion Plus' }))
})

test('details: editing a saved product pre-fills its name, brand and type', async () => {
  renderScreen(<Details />, {
    route: '/details',
    path: '/details',
    draft: ['Water'],
    draftDetails: { name: 'Lotion', brand: 'Acme', type: 'cosmetic' },
  })
  expect(await screen.findByLabelText('Product name')).toHaveValue('Lotion')
  expect(screen.getByLabelText('Brand')).toHaveValue('Acme')
  expect(screen.getByLabelText('Cosmetic')).toBeChecked()
})
