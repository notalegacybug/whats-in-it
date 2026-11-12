import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OCR_EMPTY_MESSAGE } from '../../copy'
import { renderScreen } from '../test-helpers'
import { Review } from './Review'

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
