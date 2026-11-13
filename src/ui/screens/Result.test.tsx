import { screen, within } from '@testing-library/react'
import { resultSummary } from '../../copy'
import { buildIndex } from '../../reference'
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
  expect(await screen.findByText('Used as: humectant')).toBeInTheDocument()
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

test('result: says which lists were checked, under the no-known-concern heading and by the disclaimer', async () => {
  renderResult()
  const clear = (await screen.findByRole('heading', { name: 'No known concern on these lists (1)' })).closest('section')!
  expect(within(clear).getByText('Checked against: IARC, NTP')).toBeInTheDocument()
  expect(screen.getAllByText('Checked against: IARC, NTP')).toHaveLength(2)
})

test('result: a reference with no hazard lists says so', async () => {
  renderScreen(<Result />, {
    route: '/result/p1',
    path: '/result/:id',
    store: fakeStore([rec]),
    index: buildIndex({ version: 'v-empty', builtAt: '2026-01-01', entries: [] }),
  })
  expect(await screen.findByText('Checked against: no hazard lists yet')).toBeInTheDocument()
})

test('result: a summary under the title counts the flagged ingredients and points to them', async () => {
  renderResult()
  await screen.findByRole('heading', { level: 1 })
  expect(screen.getByTestId('result-summary')).toHaveTextContent(
    '2 of 5 ingredients are on a cancer list. They are shown first, under "Watch for". We couldn\'t check 2.',
  )
})

test('result: with nothing flagged, the summary names the lists checked', async () => {
  renderScreen(<Result />, {
    route: '/result/p1',
    path: '/result/:id',
    store: fakeStore([record({ ingredients: ['Glycerin', 'Zorbex'] })]),
  })
  await screen.findByRole('heading', { level: 1 })
  expect(screen.getByTestId('result-summary').textContent).toMatch(
    /^The 1 ingredient we could check is not on the cancer lists checked \(.+\)\. We couldn't check 1\.$/,
  )
})

test('result summary wording', () => {
  expect(resultSummary({ flagged: 0, unchecked: 0, total: 33 }, ['NTP'])).toBe(
    'None of the 33 ingredients are on the cancer lists checked (NTP).',
  )
  expect(resultSummary({ flagged: 1, unchecked: 0, total: 33 }, ['NTP'])).toBe(
    '1 of 33 ingredients is on a cancer list. It is shown first, under "Watch for".',
  )
  expect(resultSummary({ flagged: 0, unchecked: 0, total: 3 }, [])).toBe(
    'No cancer lists are loaded yet, so nothing can be flagged.',
  )
  for (const s of [resultSummary({ flagged: 0, unchecked: 0, total: 3 }, ['NTP'])]) expect(s).not.toMatch(/\bsafe\b/i)
})

test('result: every ingredient carries its own verdict tag', async () => {
  renderResult()
  await screen.findByRole('heading', { level: 1 })
  const tags = screen.getAllByTestId('verdict-tag').map((t) => t.textContent)
  expect(tags).toEqual([
    'Watch for: strong evidence',
    'Watch for: possible',
    "Couldn't check",
    "Couldn't check",
    'Not on cancer lists checked',
  ])
})

test('result: a product read from a description is labelled as a partial check', async () => {
  renderScreen(<Result />, {
    route: '/result/p1',
    path: '/result/:id',
    store: fakeStore([record({ ingredients: ['Glycerin'], fromDescription: true })]),
  })
  await screen.findByRole('heading', { level: 1 })
  expect(screen.getByRole('note')).toHaveTextContent(
    'Partial check: only the ingredients named in a product description were checked. The full ingredient list may contain others.',
  )
})
