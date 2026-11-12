import type { Reference } from '../../src/reference/types'
import { diffReferences } from './diff'
import { mergeReference } from './merge'
import type { CatalogueRecord, Listing, SourceRecord } from './types'

const listing = (source: Listing['source'], extra: Partial<Listing> = {}): Listing => ({
  source,
  classification: source === 'IARC' ? 'Group 2B' : 'Listed as causing cancer',
  level: 'possible',
  year: 2000,
  url: `https://example.test/${source}`,
  ...extra,
})
const flag = (name: string, cas: string[], l: Listing): SourceRecord => ({ name, cas, listing: l })
const cat = (name: string, cas: string[], extra: Partial<CatalogueRecord> = {}): CatalogueRecord => ({
  name,
  aliases: [],
  cas,
  functionNote: '',
  euCosmeticsBanned: false,
  ...extra,
})

// Synthetic records; the CAS numbers are real, the listings are invented for these tests.
const iarcTiO2 = flag('Titanium dioxide', ['13463-67-7'], listing('IARC'))
const prop65TiO2 = flag('Titanium dioxide', ['13463-67-7'], listing('PROP65', { qualifier: 'airborne, unbound particles' }))
const cosingTiO2 = cat('Titanium Dioxide', ['13463-67-7'], { aliases: ['CI 77891'], functionNote: 'colorant' })
const alcoholicBeverages = flag('Alcoholic beverages', [], listing('IARC', { classification: 'Group 1', level: 'strong' }))
const glycerin = cat('Glycerin', ['56-81-5'], { functionNote: 'humectant' })

const base = { notes: {}, caslessAllow: new Set<string>(), version: '2026.11.1', builtAt: '2026-11-12T00:00:00.000Z' }
const ids = (r: Reference) => r.entries.map((e) => e.id)

test('records sharing a CAS number merge into one entry with all listings', () => {
  const { reference } = mergeReference({ flagged: [iarcTiO2, prop65TiO2], catalogue: [cosingTiO2], ...base })
  expect(reference.entries).toHaveLength(1)
  const e = reference.entries.find((x) => x.id === 'cas:13463-67-7')!
  expect(e.listings.map((l) => l.source).sort()).toEqual(['IARC', 'PROP65'])
  expect(e.aliases).toContain('ci 77891')
  expect(e.functionNote).toBe('colorant')
  expect(e.name).toBe('Titanium Dioxide')
  expect(e.cas).toEqual(['13463-67-7'])
})

test('a listing keeps its qualifier unchanged; identical listings are not repeated', () => {
  const q = flag('X', ['50-00-0'], listing('PROP65', { qualifier: 'airborne, unbound particles' }))
  const { reference } = mergeReference({ flagged: [q, { ...q }], catalogue: [], ...base })
  expect(reference.entries[0].listings).toEqual([q.listing])
})

test('flagged record with no CAS is dropped unless allow-listed', () => {
  const dropped = mergeReference({ flagged: [alcoholicBeverages], catalogue: [], ...base })
  expect(dropped.reference.entries).toHaveLength(0)
  const kept = mergeReference({
    flagged: [alcoholicBeverages],
    catalogue: [],
    ...base,
    caslessAllow: new Set(['alcoholic beverages']),
  })
  expect(kept.reference.entries[0].id).toBe('name:alcoholic beverages')
  expect(kept.reference.entries[0].listings).toHaveLength(1)
})

test('catalogue-only entry has no listings', () => {
  const { reference } = mergeReference({ flagged: [], catalogue: [glycerin], ...base })
  expect(reference.entries).toHaveLength(1)
  expect(reference.entries[0]).toMatchObject({ id: 'cas:56-81-5', name: 'Glycerin', listings: [], functionNote: 'humectant' })
})

test('the entry name is the catalogue name, else the shortest flagged name; other flagged names become aliases', () => {
  const longer = flag('Titanium dioxide, pigment grade', ['13463-67-7'], listing('NTP'))
  const flaggedOnly = mergeReference({ flagged: [longer, iarcTiO2], catalogue: [], ...base }).reference.entries[0]
  expect(flaggedOnly.name).toBe('Titanium dioxide')
  expect(flaggedOnly.aliases).toEqual(['titanium dioxide, pigment grade'])
  const withCatalogue = mergeReference({ flagged: [longer, iarcTiO2], catalogue: [cosingTiO2], ...base }).reference.entries[0]
  expect(withCatalogue.name).toBe('Titanium Dioxide')
  expect(withCatalogue.aliases).toEqual(['ci 77891', 'titanium dioxide, pigment grade'])
})

test('aliases are normalised, de-duplicated, never the entry own name, and at least 3 characters', () => {
  const c = cat('Glycerin', ['56-81-5'], { aliases: ['Glycerol', 'GLYCEROL', 'glycerin', 'E 422', 'ab', 'Glycerine 99%'] })
  const e = mergeReference({ flagged: [], catalogue: [c], ...base }).reference.entries[0]
  expect(e.aliases).toEqual(['e422', 'glycerine', 'glycerol'])
})

test('an alias claimed by two different entries is removed from both', () => {
  const a = cat('Alpha', ['50-00-0'], { aliases: ['shared name', 'only alpha'] })
  const b = cat('Beta', ['56-81-5'], { aliases: ['Shared Name'] })
  const { reference } = mergeReference({ flagged: [], catalogue: [a, b], ...base })
  expect(reference.entries.find((e) => e.id === 'cas:50-00-0')!.aliases).toEqual(['only alpha'])
  expect(reference.entries.find((e) => e.id === 'cas:56-81-5')!.aliases).toEqual([])
})

test('an alias equal to another entry main name is dropped from the alias holder; the main name stays', () => {
  const a = cat('Alpha', ['50-00-0'], { aliases: ['Beta'] })
  const b = cat('Beta', ['56-81-5'])
  const { reference } = mergeReference({ flagged: [], catalogue: [a, b], ...base })
  expect(reference.entries.find((e) => e.id === 'cas:50-00-0')!.aliases).toEqual([])
  expect(reference.entries.find((e) => e.id === 'cas:56-81-5')!.name).toBe('Beta')
})

test('catalogue records with no CAS merge by name into a CAS-keyed entry; otherwise they stand alone', () => {
  const eNumber = cat('Titanium dioxide', [], { aliases: ['E 171'] })
  const viaAlias = cat('ci 77891', [])
  const aqua = cat('Aqua', [])
  const { reference } = mergeReference({ flagged: [iarcTiO2], catalogue: [cosingTiO2, eNumber, viaAlias, aqua], ...base })
  expect(ids(reference)).toEqual(['cas:13463-67-7', 'name:aqua'])
  expect(reference.entries[0].aliases).toEqual(['ci 77891', 'e171'])
  expect(reference.entries[1].listings).toEqual([])
})

test('a CAS-less catalogue name that fits two different CAS-keyed entries is left out, not guessed', () => {
  const a = cat('Alpha', ['50-00-0'], { aliases: ['twin'] })
  const b = cat('Beta', ['56-81-5'], { aliases: ['twin'] })
  const { reference } = mergeReference({ flagged: [], catalogue: [a, b, cat('Twin', [])], ...base })
  expect(ids(reference)).toEqual(['cas:50-00-0', 'cas:56-81-5'])
})

test('notes and caveats attach by entry id', () => {
  const { reference } = mergeReference({
    flagged: [iarcTiO2],
    catalogue: [glycerin],
    ...base,
    notes: { 'cas:13463-67-7': { note: 'Pigment.', caveat: 'Only airborne dust is the concern.' }, 'cas:99-99-9': { note: 'ignored' } },
  })
  const tio2 = reference.entries.find((e) => e.id === 'cas:13463-67-7')!
  expect(tio2).toMatchObject({ note: 'Pigment.', caveat: 'Only airborne dust is the concern.' })
  expect(reference.entries.find((e) => e.id === 'cas:56-81-5')!.note).toBeUndefined()
})

test('missingNotes lists flagged entries that are also in the catalogue and have no note', () => {
  expect(mergeReference({ flagged: [iarcTiO2], catalogue: [cosingTiO2], ...base }).missingNotes).toEqual(['cas:13463-67-7'])
  expect(mergeReference({ flagged: [iarcTiO2], catalogue: [], ...base }).missingNotes).toEqual([])
  expect(mergeReference({ flagged: [], catalogue: [glycerin], ...base }).missingNotes).toEqual([])
  expect(
    mergeReference({ flagged: [iarcTiO2], catalogue: [cosingTiO2], ...base, notes: { 'cas:13463-67-7': { note: 'n' } } }).missingNotes,
  ).toEqual([])
})

test('missingNotes is sorted', () => {
  const lead = flag('Lead', ['7439-92-1'], listing('NTP'))
  const { missingNotes } = mergeReference({
    flagged: [lead, iarcTiO2],
    catalogue: [cat('Lead', ['7439-92-1']), cosingTiO2],
    ...base,
  })
  expect(missingNotes).toEqual(['cas:13463-67-7', 'cas:7439-92-1'])
})

test('euCosmeticsBanned carries over only onto listed entries', () => {
  const bannedListed = cat('Titanium Dioxide', ['13463-67-7'], { euCosmeticsBanned: true })
  const bannedOnly = cat('Glycerin', ['56-81-5'], { euCosmeticsBanned: true })
  const { reference } = mergeReference({ flagged: [iarcTiO2], catalogue: [bannedListed, bannedOnly], ...base })
  expect(reference.entries.find((e) => e.id === 'cas:13463-67-7')!.euCosmeticsBanned).toBe(true)
  expect(reference.entries.find((e) => e.id === 'cas:56-81-5')!.euCosmeticsBanned).toBeUndefined()
})

test('entries are sorted by id so builds are repeatable', () => {
  const input = { flagged: [prop65TiO2], catalogue: [glycerin, cat('Aqua', [])], ...base }
  const a = mergeReference(input).reference
  const b = mergeReference({ ...input, catalogue: [...input.catalogue].reverse() }).reference
  expect(ids(a)).toEqual(['cas:13463-67-7', 'cas:56-81-5', 'name:aqua'])
  expect(a).toEqual(b)
})

test('version and builtAt are passed through', () => {
  const { reference } = mergeReference({ flagged: [], catalogue: [], ...base })
  expect(reference).toEqual({ version: '2026.11.1', builtAt: '2026-11-12T00:00:00.000Z', entries: [] })
})

const entry = (id: string, name = id) => ({ id, name, aliases: [], cas: [], listings: [] })
const ref = (entries: Reference['entries'], builtAt = 'x'): Reference => ({ version: 'v', builtAt, entries })

test('diffReferences reports added, removed and changed ids', () => {
  const prev = ref([entry('cas:2-2-2'), entry('cas:50-00-0', 'old'), entry('cas:3-3-3')])
  const next = ref([entry('cas:1-1-1'), entry('cas:3-3-3'), entry('cas:50-00-0', 'new')], 'y')
  expect(diffReferences(prev, next)).toEqual({ added: ['cas:1-1-1'], removed: ['cas:2-2-2'], changed: ['cas:50-00-0'] })
  expect(diffReferences(null, next).added).toHaveLength(next.entries.length)
  expect(diffReferences(null, next).removed).toEqual([])
})

test('diffReferences ignores key order inside an entry', () => {
  const a = ref([{ id: 'cas:1-1-1', name: 'n', aliases: [], cas: [], listings: [] }])
  const b = ref([{ listings: [], cas: [], aliases: [], name: 'n', id: 'cas:1-1-1' }])
  expect(diffReferences(a, b)).toEqual({ added: [], removed: [], changed: [] })
})
