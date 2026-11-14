import type { Reference } from '../../src/reference/types'
import { diffReferences } from './diff'
import { parseFda } from './adapters/fda'
import { parseNtp } from './adapters/ntp'
import { withEdition } from './util'
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

test('a regulatory note becomes context in functionNote, not a listing', () => {
  const status = cat('Cyclamate', ['977016-96-8'], { functionNote: 'non-nutritive sweetener', regulatoryNote: 'US FDA: prohibited in food' })
  const alone = cat('Dulcin', ['150-69-6'], { regulatoryNote: 'US FDA: prohibited in food' })
  const { reference } = mergeReference({ flagged: [], catalogue: [status, alone, glycerin], ...base })
  const get = (id: string) => reference.entries.find((e) => e.id === id)!
  expect(get('cas:977016-96-8').functionNote).toBe('non-nutritive sweetener · Regulatory note: US FDA: prohibited in food')
  expect(get('cas:977016-96-8').listings).toEqual([])
  expect(get('cas:150-69-6').functionNote).toBe('Regulatory note: US FDA: prohibited in food')
  expect(get('cas:56-81-5').functionNote).toBe('humectant')
})

test('real FDA rows (cyclamate, coumarin, a delisted FD&C colour) keep their status through the merge', () => {
  const col = 'Used for (Technical Effect)'
  const catalogue = parseFda([
    { 'CAS Reg No (or other ID)': ' 977016-96-8', Substance: ' CYCLAMATE--PROHIBITED', [col]: ' NON-NUTRITIVE SWEETENER' },
    { 'CAS Reg No (or other ID)': ' 91-64-5', Substance: ' COUMARIN--PROHIBITED', [col]: ' FLAVORING AGENT OR ADJUVANT' },
    { 'CAS Reg No (or other ID)': ' 4680-78-8', Substance: ' FD&C GREEN NO. 1--DELISTED', [col]: '' },
  ])
  catalogue.push(...parseFda([{ 'CAS Reg No (or other ID)': ' 100-42-5', Substance: ' STYRENE--NLFG', [col]: ' FLAVORING AGENT OR ADJUVANT' }]))
  const { reference } = mergeReference({ flagged: [], catalogue, ...base })
  const notes = Object.fromEntries(reference.entries.map((e) => [e.name, e.functionNote]))
  expect(notes).toEqual({
    Styrene: 'flavoring agent or adjuvant · Regulatory note: Flavour industry (FEMA): no longer listed as GRAS',
    Cyclamate: 'non-nutritive sweetener · Regulatory note: US FDA: prohibited in food',
    Coumarin: 'flavoring agent or adjuvant · Regulatory note: US FDA: prohibited in food',
    'FD&C green No. 1': 'Regulatory note: US FDA: delisted (no longer permitted)',
  })
})

test('an NTP edition from config rides on each listing through the merge', () => {
  const flagged = withEdition(
    parseNtp([
      { Name: 'Formaldehyde', CAS: '50-00-0', Listing: 'Known to be a human carcinogen', Year: '' },
      { Name: 'Formalin', CAS: '50-00-0', Listing: 'Known to be a human carcinogen', Year: '' },
    ]),
    '15th Report on Carcinogens (2021)',
  )
  const { reference } = mergeReference({ flagged, catalogue: [], ...base })
  expect(reference.entries[0].listings).toEqual([
    {
      source: 'NTP',
      classification: 'Known to be a human carcinogen',
      level: 'strong',
      year: null,
      url: 'https://ntp.niehs.nih.gov/go/roc',
      edition: '15th Report on Carcinogens (2021)',
    },
  ])
})

test('listings that differ only in edition are both kept', () => {
  const a = flag('X', ['50-00-0'], listing('NTP', { edition: '14th' }))
  const b = flag('X', ['50-00-0'], listing('NTP', { edition: '15th' }))
  expect(mergeReference({ flagged: [a, b], catalogue: [], ...base }).reference.entries[0].listings).toHaveLength(2)
})

test('a CAS number held by two entries stays only where it is the main number', () => {
  // Real CosIng shape: Ceramide NP lists a generic CAS that is another ceramide's own number.
  const ceramideNp = cat('Ceramide NP', ['34354-88-6', '100403-19-8'])
  const ceramideGeneric = cat('Ceramide 3', ['100403-19-8'])
  const { reference } = mergeReference({ flagged: [], catalogue: [ceramideNp, ceramideGeneric], ...base })
  const byId = Object.fromEntries(reference.entries.map((e) => [e.id, e.cas]))
  expect(byId['cas:34354-88-6']).toEqual(['34354-88-6'])
  expect(byId['cas:100403-19-8']).toEqual(['100403-19-8'])
})

test('a secondary CAS number shared by two entries and nobody\'s main number is dropped from both', () => {
  const a = cat('Iron Oxide A', ['1309-37-1', '12227-89-3'])
  const b = cat('Iron Oxide B', ['1332-25-8', '12227-89-3'])
  const { reference } = mergeReference({ flagged: [], catalogue: [a, b], ...base })
  for (const e of reference.entries) expect(e.cas).not.toContain('12227-89-3')
})

test('entries with the same main name merge, so a label name never misses a listing', () => {
  // Real shape: NTP lists lead acetate under 15347-57-6, CosIng under 301-04-2.
  const ntp = flag('Lead Acetate', ['15347-57-6'], listing('NTP', { level: 'possible' }))
  const cosing = cat('LEAD ACETATE', ['301-04-2'], { functionNote: 'hair dyeing' })
  const { reference } = mergeReference({ flagged: [ntp], catalogue: [cosing], ...base })
  expect(reference.entries).toHaveLength(1)
  const e = reference.entries[0]
  expect(e.id).toBe('cas:15347-57-6')
  expect(e.listings).toHaveLength(1)
  expect(e.cas.sort()).toEqual(['15347-57-6', '301-04-2'])
})

test('two unlisted entries with the same main name become one', () => {
  const fda = cat('Calcium chloride', ['10043-52-4'], { functionNote: 'firming agent' })
  const cosing = cat('CALCIUM CHLORIDE', ['10035-04-8'], { functionNote: 'bulking' })
  const { reference } = mergeReference({ flagged: [], catalogue: [fda, cosing], ...base })
  expect(reference.entries).toHaveLength(1)
  expect(reference.entries[0].id).toBe('cas:10035-04-8')
})

describe('common names from lower-ranked name sources', () => {
  const coconut = cat('Cocos Nucifera Oil', ['8001-31-8'])
  const pantothenic = cat('Pantothenic Acid', ['79-83-4'])
  const panthenol = cat('Panthenol', ['81-13-0'])
  const formaldehyde = flag('Formaldehyde', ['50-00-0'], listing('NTP', { level: 'strong' }))
  const run = (commonNames: { joinNames: string[]; commonNames: string[] }[][]) =>
    mergeReference({ flagged: [formaldehyde], catalogue: [coconut, pantothenic, panthenol], commonNames, ...base }).reference
  const aliasesOf = (r: Reference, id: string) => r.entries.find((e) => e.id === id)!.aliases

  test('a substance found by its official name (brackets removed) gains its everyday names', () => {
    const r = run([[{ joinNames: ['COCOS NUCIFERA (COCONUT) OIL'], commonNames: ['Coconut oil', 'COCOS NUCIFERA (COCONUT) OIL'] }]])
    expect(aliasesOf(r, 'cas:8001-31-8')).toEqual(expect.arrayContaining(['coconut oil', 'cocos nucifera (coconut) oil']))
  })

  test('a common name never takes over an existing name of another entry', () => {
    const r = run([[{ joinNames: ['Cocos Nucifera Oil'], commonNames: ['Formaldehyde', 'Panthenol'] }]])
    expect(aliasesOf(r, 'cas:8001-31-8')).not.toContain('formaldehyde')
    expect(aliasesOf(r, 'cas:8001-31-8')).not.toContain('panthenol')
  })

  test('a substance whose names reach a flagged and an unflagged entry is skipped', () => {
    const r = run([[{ joinNames: ['Formaldehyde', 'Cocos Nucifera Oil'], commonNames: ['Mystery Preservative'] }]])
    expect(r.entries.some((e) => e.aliases.includes('mystery preservative'))).toBe(false)
  })

  test('a substance whose names reach several unflagged entries attaches to the base (shortest) name', () => {
    const r = run([[{ joinNames: ['Pantothenic Acid', 'Panthenol'], commonNames: ['Vitamin B5'] }]])
    expect(aliasesOf(r, 'cas:81-13-0')).toContain('vitamin b5')
  })

  test('codes, lab impurity names and dotted chemical names are not added', () => {
    const r = run([[{ joinNames: ['Cocos Nucifera Oil'], commonNames: ['NCI-C56393', 'Colestyramine Impurity A', '.beta.-Coconut', 'Coconut Oil'] }]])
    expect(aliasesOf(r, 'cas:8001-31-8')).toEqual(['coconut oil'])
  })

  test('within one source, a common name claimed for two entries is dropped', () => {
    const r = run([[
      { joinNames: ['Panthenol'], commonNames: ['Vitamin B5'] },
      { joinNames: ['Pantothenic Acid'], commonNames: ['Vitamin B5'] },
    ]])
    // Two substances in one source claim the same everyday name: neither gets it.
    expect(r.entries.some((e) => e.aliases.includes('vitamin b5'))).toBe(false)
  })

  test('a higher-ranked source claims a name first', () => {
    const r = run([
      [{ joinNames: ['Panthenol'], commonNames: ['Vitamin B5'] }],
      [{ joinNames: ['Pantothenic Acid'], commonNames: ['Vitamin B5'] }],
    ])
    expect(aliasesOf(r, 'cas:81-13-0')).toContain('vitamin b5')
    expect(aliasesOf(r, 'cas:79-83-4')).not.toContain('vitamin b5')
  })

  test('vague or code-like names are not added', () => {
    const r = run([[{ joinNames: ['Cocos Nucifera Oil'], commonNames: ['Oil', 'COCONUT OIL, UNHYDROGENATED', 'a very long name that goes on and on past six words'] }]])
    expect(aliasesOf(r, 'cas:8001-31-8')).toEqual([])
  })
})
