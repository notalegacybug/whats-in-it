import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OCR_EMPTY_MESSAGE } from '../../copy'
import { suggest } from '../../reference/suggest'
import { renderScreen } from '../test-helpers'
import { Review } from './Review'

vi.mock('../../reference/suggest', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../reference/suggest')>()
  return { ...real, suggest: vi.fn(real.suggest) }
})

const user = userEvent.setup()
const renderReview = (draft: string[]) => renderScreen(<Review />, { route: '/review', path: '/review', draft })

test('review: empty draft shows the couldn’t-read message and disables checking', async () => {
  renderReview([])
  expect(await screen.findByText(OCR_EMPTY_MESSAGE)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Check ingredients' })).toBeDisabled()
})

test('review: rows are labelled and removable', async () => {
  renderReview(['Water', 'Glycerin'])
  expect(await screen.findByLabelText('Ingredient 2')).toHaveValue('Glycerin')
  await user.click(screen.getByRole('button', { name: 'Remove Water' }))
  expect(screen.queryByDisplayValue('Water')).not.toBeInTheDocument()
  expect(screen.getByLabelText('Ingredient 1')).toHaveValue('Glycerin')
})

test('review: suggestion button replaces the row text', async () => {
  renderReview(['Forma1dehyde'])
  await user.click(await screen.findByRole('button', { name: 'Did you mean Formaldehyde?' }))
  expect(screen.getByDisplayValue('Formaldehyde')).toBeInTheDocument()
})

test('review: pasting a list replaces the draft', async () => {
  renderReview(['Old thing'])
  await user.click(await screen.findByLabelText('Paste a list'))
  await user.paste('Water, Glycerin')
  await user.click(screen.getByRole('button', { name: 'Use this list' }))
  expect(screen.queryByDisplayValue('Old thing')).not.toBeInTheDocument()
  expect(screen.getByLabelText('Ingredient 1')).toHaveValue('Water')
  expect(screen.getByLabelText('Ingredient 2')).toHaveValue('Glycerin')
})

test('review: Add ingredient appends an empty row; Check ingredients goes to details', async () => {
  renderReview(['Water'])
  await user.click(await screen.findByRole('button', { name: 'Add ingredient' }))
  expect(screen.getByLabelText('Ingredient 2')).toHaveValue('')
  await user.click(screen.getByRole('button', { name: 'Check ingredients' }))
  expect(screen.getByTestId('where')).toHaveTextContent('/details')
})

test('review: typing in one row does not rescan the unchanged rows for suggestions', async () => {
  renderReview(['Water', 'Glycerin', 'Forma1dehyde'])
  const first = await screen.findByLabelText('Ingredient 1')
  vi.mocked(suggest).mockClear()
  await user.type(first, 'x')
  const texts = vi.mocked(suggest).mock.calls.map(([text]) => text)
  expect(texts).toContain('Waterx')
  expect(texts).not.toContain('Glycerin')
  expect(texts).not.toContain('Forma1dehyde')
  expect(screen.getByRole('button', { name: 'Did you mean Formaldehyde?' })).toBeInTheDocument()
})

test('review: a pasted description becomes the names it mentions, with a partial-check notice', async () => {
  renderReview([])
  await user.click(await screen.findByLabelText('Paste a list'))
  await user.paste('Our cream is enriched with Formaldehyde and Glycerin to help your skin, while we keep it light and fresh for you.')
  await user.click(screen.getByRole('button', { name: 'Use this list' }))
  expect(screen.getByLabelText('Ingredient 1')).toHaveValue('Formaldehyde')
  expect(screen.getByLabelText('Ingredient 2')).toHaveValue('Glycerin')
  expect(screen.getByRole('note')).toHaveTextContent(/looks like a product description/)
})

test('review: a description with no known names explains what to look for', async () => {
  renderReview([])
  await user.click(await screen.findByLabelText('Paste a list'))
  await user.paste('Our lovely cream helps your skin glow, while we keep it light and fresh for you every day.')
  await user.click(screen.getByRole('button', { name: 'Use this list' }))
  expect(screen.getByRole('note')).toHaveTextContent(/no ingredient names we know/)
})

test('review: a "may contain" line is picked up and shown, separate from the ingredients', async () => {
  renderReview([])
  await user.click(await screen.findByLabelText('Paste a list'))
  await user.paste('Ingredients: Sugar, Cocoa Butter. May contain: nuts, milk.')
  await user.click(screen.getByRole('button', { name: 'Use this list' }))
  expect(screen.getByLabelText('Ingredient 1')).toHaveValue('Sugar')
  expect(screen.getByLabelText('Ingredient 2')).toHaveValue('Cocoa Butter')
  expect(screen.queryByLabelText('Ingredient 3')).not.toBeInTheDocument()
  expect(screen.getByTestId('may-contain')).toHaveTextContent('Label says it may contain: milk, tree nuts')
})
