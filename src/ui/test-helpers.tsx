import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { buildIndex } from '../reference'
import type { RefIndex } from '../reference'
import type { NewProduct, ProductRecord, ProductStore } from '../products/types'
import { ReferenceGate } from './ReferenceGate'
import { ScanDraftProvider } from './ScanDraft'
import { StoreContext } from './StoreContext'

export const testIndex: RefIndex = buildIndex({
  version: 'v-test',
  builtAt: '2026-01-01',
  entries: [
    {
      id: 'cas:50-00-0',
      name: 'Formaldehyde',
      aliases: [],
      cas: ['50-00-0'],
      note: 'Released by some preservatives.',
      caveat: 'Hazard depends on exposure.',
      euCosmeticsBanned: true,
      listings: [
        {
          source: 'IARC',
          classification: 'Group 1',
          level: 'strong',
          year: 2012,
          url: 'https://monographs.iarc.who.int/list-of-classifications',
          qualifier: 'inhalation',
        },
      ],
    },
    {
      id: 'name:aloe',
      name: 'Aloe vera',
      aliases: [],
      cas: [],
      listings: [
        { source: 'NTP', classification: 'Reasonably anticipated', level: 'possible', year: null, url: 'https://ntp.example/aloe' },
      ],
    },
    { id: 'name:glycerin', name: 'Glycerin', aliases: [], cas: [], functionNote: 'humectant', listings: [] },
  ],
})

/** In-memory ProductStore; vi.fn so tests can assert calls. */
export function fakeStore(seed: ProductRecord[] = []) {
  const rows = [...seed]
  const store = {
    findMatches: vi.fn(async (p: NewProduct) => rows.filter((r) => r.name === p.name && r.brand === p.brand)),
    save: vi.fn(async (p: NewProduct) => {
      const rec: ProductRecord = { ...p, id: `id-${rows.length + 1}`, createdAt: '2026-01-01T00:00:00Z' }
      rows.push(rec)
      return rec
    }),
    get: vi.fn(async (id: string) => rows.find((r) => r.id === id) ?? null),
    search: vi.fn(async (_text: string): Promise<ProductRecord[]> => []),
  }
  return store satisfies ProductStore
}

export function record(over: Partial<ProductRecord> = {}): ProductRecord {
  return {
    id: 'p1',
    name: 'Lotion',
    brand: 'Acme',
    type: 'cosmetic',
    barcode: null,
    ingredients: [],
    referenceVersion: 'v-test',
    createdAt: '2026-01-01T00:00:00Z',
    ...over,
  }
}

function Where() {
  const { pathname } = useLocation()
  return <p data-testid="where">{pathname}</p>
}

/** Renders `ui` (which may contain its own <Routes>) at `path` with all providers; any other route shows its pathname. */
export function renderScreen(
  ui: ReactElement,
  opts: { route: string; path: string; draft?: string[]; store?: ProductStore },
) {
  return render(
    <MemoryRouter initialEntries={[opts.route]}>
      <StoreContext.Provider value={opts.store ?? fakeStore()}>
        <ReferenceGate load={() => Promise.resolve(testIndex)}>
          <ScanDraftProvider initial={opts.draft}>
            <Routes>
              <Route path={opts.path} element={ui} />
              <Route path="*" element={<Where />} />
            </Routes>
          </ScanDraftProvider>
        </ReferenceGate>
      </StoreContext.Provider>
    </MemoryRouter>,
  )
}
