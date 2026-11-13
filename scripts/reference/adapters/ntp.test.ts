import { parseNtp } from './ntp'

const KNOWN = 'Known to be a human carcinogen'
const RAHC = 'Reasonably anticipated to be a human carcinogen'

// Rows from data/sources/ntp.csv (NTP 15th Report on Carcinogens, CASRN index spreadsheet on the NTP page).
const fixture: Record<string, string>[] = [
  { Name: 'Formaldehyde', CAS: '50-00-0', Listing: KNOWN, Year: '' },
  { Name: 'Acetaldehyde', CAS: '75-07-0', Listing: RAHC, Year: '' },
  { Name: 'Estradiol-17B (see Estrogens, Steroidal)', CAS: '50-28-2', Listing: KNOWN, Year: '' },
  { Name: 'Wood Dust', CAS: '', Listing: KNOWN, Year: '2015' },
  { Name: 'Something delisted', CAS: '50-00-0', Listing: 'Not listed', Year: '' },
]

test('NTP: listing text sets the level', () => {
  const out = parseNtp(fixture)
  expect(out.find((r) => r.name === 'Formaldehyde')!.listing).toMatchObject({
    source: 'NTP',
    classification: KNOWN,
    level: 'strong',
    url: 'https://ntp.niehs.nih.gov/go/roc',
  })
  expect(out.find((r) => r.name === 'Acetaldehyde')!.listing).toMatchObject({
    classification: RAHC,
    level: 'possible',
  })
})

test('NTP: rows with any other listing text are dropped', () => {
  expect(parseNtp(fixture).some((r) => r.name === 'Something delisted')).toBe(false)
})

test('NTP: a trailing "(see ...)" cross-reference is removed from the name', () => {
  expect(parseNtp(fixture).map((r) => r.name)).toContain('Estradiol-17B')
})

test('NTP: year from the Year column, null when blank; empty CAS kept as []', () => {
  const out = parseNtp(fixture)
  expect(out.find((r) => r.name === 'Formaldehyde')!.listing.year).toBeNull()
  const wood = out.find((r) => r.name === 'Wood Dust')!
  expect(wood.listing.year).toBe(2015)
  expect(wood.cas).toEqual([])
})

test('NTP: rows with missing cells do not throw and are skipped when nameless', () => {
  expect(parseNtp([{ Listing: KNOWN }, { Name: 'X' }])).toEqual([])
})

test('NTP: cross-references containing brackets are removed in full', () => {
  const out = parseNtp([
    { Name: 'Bis(chloromethyl) Ether (see Bis(chloromethyl) Ether and Technical-Grade Chloromethyl Methyl Ether)', CAS: '542-88-1', Listing: KNOWN },
    { Name: 'a-Hexachlorocyclohexane (see Lindane, Hexachlorocyclohexane Technical Grade), and Other Hexachlorocyclohexane Isomers)', CAS: '319-84-6', Listing: RAHC },
  ])
  expect(out.map((r) => r.name)).toEqual(['Bis(chloromethyl) Ether', 'a-Hexachlorocyclohexane'])
})

test('NTP: a "(see Parent)" reference becomes a "Listed as part of" qualifier, not lost', () => {
  const out = parseNtp([
    { Name: 'Sulfuric Acid (see Strong Inorganic Acid Mists Containing Sulfuric Acid)', CAS: '7664-93-9', Listing: KNOWN },
    { Name: 'Quartz (see Silica)', CAS: '14808-60-7', Listing: KNOWN },
    { Name: 'Formaldehyde', CAS: '50-00-0', Listing: KNOWN },
  ])
  expect(out[0].name).toBe('Sulfuric Acid')
  expect(out[0].listing).toMatchObject({
    level: 'strong',
    qualifier: 'Listed as part of: Strong Inorganic Acid Mists Containing Sulfuric Acid',
  })
  expect(out[1].listing.qualifier).toBe('Listed as part of: Silica')
  expect(out[2].listing.qualifier).toBeUndefined()
})
