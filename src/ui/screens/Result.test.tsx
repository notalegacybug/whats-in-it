import { screen } from '@testing-library/react'
import { addScan } from '../../scans/myScans'
import { fakeStore, record, renderScreen } from '../test-helpers'
import { Result } from './Result'

vi.mock('../../scans/myScans', () => ({ addScan: vi.fn().mockResolvedValue(undefined) }))

const rec = record({ ingredients: ['Water', 'Glycerin', 'Formaldehyde', 'Aloe vera', 'Zorbex'] })
const renderResult = (id = 'p1') =>
  renderScreen(<Result />, { route: `/result/${id}`, path: '/result/:id', store: fakeStore([rec]) })

test('result: headings appear in severity order with counts', async () => {
  renderResult()
  await screen.findByRole('heading', { level: 1, name: 'Acme Lotion' })
  const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
  expect(headings).toEqual([
    'Watch for (strong evidence) (1)',
    'Watch for (possible) (1)',
    'Not recognised (2)',
    'No known concern on these lists (1)',
  ])
})

test('result: a heading with no items is not rendered', async () => {
  renderScreen(<Result />, {
    route: '/result/p1',
    path: '/result/:id',
    store: fakeStore([record({ ingredients: ['Glycerin'] })]),
  })
  await screen.findByRole('heading', { level: 1 })
  expect(screen.queryByRole('heading', { name: /Watch for/ })).not.toBeInTheDocument()
})

test('result: a listed item shows source, classification, year and a link', async () => {
  renderResult()
  const link = await screen.findByRole('link', { name: /IARC · Group 1 · 2012/ })
  expect(link).toHaveAttribute('href', 'https://monographs.iarc.who.int/list-of-classifications')
  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  expect(screen.getByText('inhalation')).toBeInTheDocument()
  expect(screen.getByText('Released by some preservatives.')).toBeInTheDocument()
  expect(screen.getByText('Hazard depends on exposure.')).toBeInTheDocument()
  expect(screen.getByText('Also banned in EU cosmetics')).toBeInTheDocument()
})

test('result: a listing without a year omits the year', async () => {
  renderResult()
  expect(await screen.findByRole('link', { name: 'NTP · Reasonably anticipated' })).toBeInTheDocument()
})

test('result: clear and unrecognised items show their text', async () => {
  renderResult()
  expect(await screen.findByText('humectant')).toBeInTheDocument()
  expect(screen.getAllByText("We couldn't check this one.")).toHaveLength(2)
})

test('result: never contains the word "safe"', async () => {
  renderResult()
  await screen.findByRole('heading', { level: 1 })
  expect(document.body.textContent).not.toMatch(/\bsafe\b/i)
})

test('result: shows the disclaimer and records the scan', async () => {
  renderResult()
  expect(await screen.findByText(/Not medical advice/)).toBeInTheDocument()
  expect(addScan).toHaveBeenCalledWith('p1')
})

test('result: an unknown id says so and links home', async () => {
  renderResult('nope')
  expect(await screen.findByText("We couldn't find that product.")).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Back to start' })).toHaveAttribute('href', '/')
})
