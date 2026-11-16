import userEvent from '@testing-library/user-event'
import { screen, within } from '@testing-library/react'
import { resultSummary } from '../../copy'
import { buildIndex } from '../../reference'
import { addScan } from '../../scans/myScans'
import { fakeStore, record, renderScreen } from '../test-helpers'
import { Result } from './Result'

vi.mock('../../scans/myScans', () => ({ addScan: vi.fn().mockResolvedValue(undefined) }))

const notesStore = vi.hoisted(() => new Map<string, import('../../notes/myNotes').MyNote>())
vi.mock('../../notes/myNotes', () => ({
  getNotes: vi.fn(async () => new Map(notesStore)),
  saveNote: vi.fn(async (n: Omit<import('../../notes/myNotes').MyNote, 'updatedAt'>) => {
    const row = { ...n, updatedAt: 'now' }
    notesStore.set(n.key, row)
    return row
  }),
  deleteNote: vi.fn(async (key: string) => {
    notesStore.delete(key)
  }),
}))

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
  expect(screen.getAllByTestId('sources')[0]).toHaveTextContent('(inhalation)')
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

describe('your own research on ingredients the app could not check', () => {
  const user = userEvent.setup()
  beforeEach(() => {
    notesStore.clear()
  })

  test('add a tag, note and link; it shows as set by you, and the app verdict stays', async () => {
    renderResult()
    await user.click(await screen.findByRole('button', { name: 'Add your research for Zorbex' }))
    await user.selectOptions(screen.getByLabelText('Your tag'), 'no_concern')
    await user.type(screen.getByLabelText('Your note'), 'Maker study, 2024.')
    await user.type(screen.getByLabelText('Link (optional)'), 'https://example.org/zorbex')
    await user.click(screen.getByRole('button', { name: 'Save research' }))
    const mine = await screen.findByRole('region', { name: 'Your research for Zorbex' })
    expect(mine).toHaveTextContent('Your research: no concern')
    expect(mine).toHaveTextContent('Set by you, not checked by the app')
    expect(mine).toHaveTextContent('Maker study, 2024.')
    expect(within(mine).getByRole('link', { name: 'https://example.org/zorbex' })).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByRole('heading', { name: 'Not recognised (2)' })).toBeInTheDocument()
    expect(screen.getByTestId('result-summary')).toHaveTextContent('You added your own research for 1.')
  })

  test('saved research shows on load and can be deleted', async () => {
    notesStore.set('zorbex', { key: 'zorbex', label: 'Zorbex', tag: 'watch', note: 'Found a warning.', link: '', updatedAt: 'x' })
    renderResult()
    const mine = await screen.findByRole('region', { name: 'Your research for Zorbex' })
    expect(mine).toHaveTextContent('Your research: watch for')
    await user.click(within(mine).getByRole('button', { name: 'Delete' }))
    expect(screen.queryByRole('region', { name: 'Your research for Zorbex' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add your research for Zorbex' })).toBeInTheDocument()
  })
})

test('result: edit ingredients opens the review screen with this product loaded', async () => {
  const user = userEvent.setup()
  renderResult()
  await user.click(await screen.findByRole('button', { name: 'Edit ingredients' }))
  expect(screen.getByTestId('where')).toHaveTextContent('/review')
})

describe('hormone-disruptor check', () => {
  const user = userEvent.setup()
  const hormoneIndex = buildIndex({
    version: 'v-h',
    builtAt: '2026-01-01',
    sources: ['NTP', 'ED_LISTS'],
    entries: [
      {
        id: 'cas:94-26-8',
        name: 'Butylparaben',
        aliases: [],
        cas: ['94-26-8'],
        functionNote: 'preservative',
        listings: [
          { source: 'ED_LISTS', hazard: 'hormone', classification: 'Identified as an endocrine disruptor at EU level', level: 'strong', year: 2020, url: 'https://edlists.org/x' },
        ],
      },
      { id: 'name:glycerin', name: 'Glycerin', aliases: [], cas: [], listings: [] },
    ],
  })
  const open = (over = {}) => {
    const store = fakeStore([record({ ingredients: ['Butylparaben', 'Glycerin'], ...over })])
    renderScreen(<Result />, { route: '/result/p1', path: '/result/:id', store, index: hormoneIndex })
    return store
  }

  test('off by default: a hormone-listed ingredient is not flagged until the check is turned on', async () => {
    const store = open()
    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByRole('heading', { name: /Watch for/ })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Check hormone & reproductive effects' }))
    expect(screen.getByRole('heading', { name: 'Watch for (strong evidence) (1)' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'EU ED Lists · Identified as an endocrine disruptor at EU level · 2020' })).toHaveTextContent('EU ED Lists 2020')
    expect(screen.getByText('Hormone list')).toBeInTheDocument()
    expect(screen.getByText('Used as: preservative')).toBeInTheDocument()
    expect(screen.getByTestId('result-summary')).toHaveTextContent('1 of 2 ingredients is on a cancer, hormone or reproductive list.')
    expect(screen.getAllByText('Checked against: NTP, EU ED Lists').length).toBeGreaterThan(0)
    expect(store.setChecks).toHaveBeenCalledWith('p1', ['hormone'])
  })

  test('a product saved with the check on opens with it on, and it can be hidden again', async () => {
    const store = open({ checks: ['hormone'] })
    expect(await screen.findByRole('heading', { name: 'Watch for (strong evidence) (1)' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Hide hormone & reproductive check' }))
    expect(screen.queryByRole('heading', { name: /Watch for/ })).not.toBeInTheDocument()
    expect(store.setChecks).toHaveBeenCalledWith('p1', [])
  })

  test('no button when the reference has no hormone lists', async () => {
    renderResult()
    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByRole('button', { name: 'Check hormone & reproductive effects' })).not.toBeInTheDocument()
  })
})

describe('allergen tags', () => {
  const allergenIndex = buildIndex({
    version: 'v-a',
    builtAt: '2026-01-01',
    sources: ['NTP'],
    entries: [
      { id: 'cas:78-70-6', name: 'Linalool', aliases: [], cas: ['78-70-6'], listings: [], fragranceAllergen: true },
      { id: 'name:glycerin', name: 'Glycerin', aliases: [], cas: [], listings: [] },
    ],
  })

  test('fragrance and food allergens get a small tag each; the summary counts them; verdicts are unchanged', async () => {
    const store = fakeStore([record({ ingredients: ['Linalool', 'Glycerin', 'Whole Milk Powder', 'Soya Lecithin'] })])
    renderScreen(<Result />, { route: '/result/p1', path: '/result/:id', store, index: allergenIndex })
    await screen.findByRole('heading', { level: 1 })
    const tags = screen.getAllByTestId('allergen-tag').map((t) => t.textContent).sort()
    expect(tags).toEqual(['Allergen: fragrance', 'Allergen: milk', 'Allergen: soy'])
    expect(screen.getByTestId('result-summary')).toHaveTextContent('3 contain a known allergen.')
    expect(screen.queryByRole('heading', { name: /Watch for/ })).not.toBeInTheDocument()
  })
})

test('result: a saved "may contain" warning shows as allergen tags under the summary', async () => {
  const store = fakeStore([record({ ingredients: ['Glycerin'], mayContain: ['Peanuts', 'Tree nuts'] })])
  renderScreen(<Result />, { route: '/result/p1', path: '/result/:id', store })
  await screen.findByRole('heading', { level: 1 })
  expect(screen.getByTestId('may-contain')).toHaveTextContent('Label says it may contain: peanuts, tree nuts')
})

test('turning on the extra check gives a clear answer next to the button and at the top, even when nothing is found', async () => {
  const user = userEvent.setup()
  const index = buildIndex({ version: 'v', builtAt: 'x', sources: ['NTP', 'ED_LISTS', 'PROP65'], entries: [{ id: 'name:glycerin', name: 'Glycerin', aliases: [], cas: [], listings: [] }] })
  renderScreen(<Result />, { route: '/result/p1', path: '/result/:id', store: fakeStore([record({ ingredients: ['Glycerin'] })]), index })
  await user.click(await screen.findByRole('button', { name: 'Check hormone & reproductive effects' }))
  expect(screen.getByTestId('extra-check-result')).toHaveTextContent('Hormone & reproductive check: none of the ingredients are on these lists.')
  expect(screen.getByTestId('check-lines')).toHaveTextContent('Hormone & reproductive lists: none found')
  expect(screen.getByTestId('check-lines')).toHaveTextContent('Cancer lists: none found')
})
