import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { OCR_EMPTY_MESSAGE } from '../../copy'
import { readImage } from '../../ocr/readImage'
import { renderScreen } from '../test-helpers'
import { Capture } from './Capture'
import { Review } from './Review'

vi.mock('../../ocr/readImage')

const user = userEvent.setup()
const image = new File(['x'], 'label.png', { type: 'image/png' })

beforeEach(() => {
  vi.mocked(readImage).mockReset()
})

function renderCapture(mode: string) {
  return renderScreen(
    <Routes>
      <Route path="/capture" element={<Capture />} />
      <Route path="/review" element={<Review />} />
    </Routes>,
    { route: `/capture?mode=${mode}`, path: '*' },
  )
}



test('capture: camera mode asks for the rear camera', async () => {
  renderCapture('camera')
  const input = await screen.findByLabelText('Take a photo of the label')
  expect(input).toHaveAttribute('accept', 'image/*')
  expect(input).toHaveAttribute('capture', 'environment')
})

test('capture: file mode has no capture attribute', async () => {
  renderCapture('file')
  expect(await screen.findByLabelText('Choose an image of the label')).not.toHaveAttribute('capture')
})

test('capture: reading shows progress, then the extracted list is in review', async () => {
  let finish!: (t: string) => void
  vi.mocked(readImage).mockReturnValue(new Promise((r) => (finish = r)))
  renderCapture('file')
  await user.upload(await screen.findByLabelText('Choose an image of the label'), image)
  expect(await screen.findByText('Reading the label…')).toBeInTheDocument()
  expect(screen.getByRole('progressbar')).toBeInTheDocument()
  finish('Ingredients: Water, Glycerin')
  expect(await screen.findByLabelText('Ingredient 1')).toHaveValue('Water')
  expect(screen.getByLabelText('Ingredient 2')).toHaveValue('Glycerin')
})

test('capture: unreadable image leads to review with the empty message', async () => {
  vi.mocked(readImage).mockResolvedValue('')
  renderCapture('file')
  await user.upload(await screen.findByLabelText('Choose an image of the label'), image)
  expect(await screen.findByText(OCR_EMPTY_MESSAGE)).toBeInTheDocument()
})

test('capture: a failed read also leads to review with the empty message', async () => {
  vi.mocked(readImage).mockRejectedValue(new Error('ocr failed'))
  renderCapture('file')
  await user.upload(await screen.findByLabelText('Choose an image of the label'), image)
  expect(await screen.findByText(OCR_EMPTY_MESSAGE)).toBeInTheDocument()
})

test('capture: text mode goes straight to review with an empty draft', async () => {
  renderCapture('text')
  expect(await screen.findByText(OCR_EMPTY_MESSAGE)).toBeInTheDocument()
  await waitFor(() => expect(readImage).not.toHaveBeenCalled())
})
