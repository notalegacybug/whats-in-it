import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { addScan } from '../../scans/myScans'
import { fakeStore, record, renderScreen } from '../test-helpers'
import { Details } from './Details'

vi.mock('../../scans/myScans', () => ({ addScan: vi.fn().mockResolvedValue(undefined) }))

const user = userEvent.setup()

async function fillAndSubmit() {
  await user.type(await screen.findByLabelText('Product name'), 'Lotion')
  await user.type(screen.getByLabelText('Brand'), 'Acme')
  await user.click(screen.getByLabelText('Cosmetic'))
  await user.click(screen.getByRole('button', { name: 'Save and see result' }))
}

const renderDetails = (store = fakeStore()) =>
  renderScreen(<Details />, { route: '/details', path: '/details', draft: ['Water'], store })

test('details: an empty draft redirects home', async () => {
  renderScreen(<Details />, { route: '/details', path: '/details', draft: [] })
  expect(await screen.findByTestId('where')).toHaveTextContent('/')
})

test('details: a likely-same product prompts before saving; "Yes" opens the saved record and saves nothing', async () => {
  const store = fakeStore([record({ id: 'old' })])
  renderDetails(store)
  await fillAndSubmit()
  expect(await screen.findByText('Is this the same as Acme Lotion?')).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Yes, show saved result' }))
  expect(screen.getByTestId('where')).toHaveTextContent('/result/old')
  expect(store.save).not.toHaveBeenCalled()
})

test('details: "No, save as new" saves and opens the new result', async () => {
  const store = fakeStore([record({ id: 'old' })])
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
