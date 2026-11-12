import { parseProp65 } from './prop65'

const row = (chemical: string, toxicity: string, cas: string, date: string): Record<string, string> => ({
  Chemical: chemical,
  'Type of Toxicity': toxicity,
  'CAS No.': cas,
  'Date Listed': date,
})

// FIXTURE, NOT COPIED FROM THE REAL FILE: OEHHA's site blocked automated download (see data/sources/README.md).
// Rows follow the documented column layout (Chemical, Type of Toxicity, CAS No., Date Listed).
const fixture: Record<string, string>[] = [
  row('Titanium dioxide (airborne, unbound particles of respirable size)', 'cancer', '13463-67-7', 'September 2, 2011'),
  row('Formaldehyde (gas)', 'cancer', '50-00-0', 'January 1, 1988'),
  row('Toluene', 'developmental, female, male', '108-88-3', 'January 1, 1991'),
  row('Benzene', 'cancer, developmental, male', '71-43-2', 'February 27, 1987'),
  row('Acetaldehyde', 'cancer', '75-07-0', ''),
]

test('Prop 65: only cancer rows; bracketed route text moves to qualifier', () => {
  const out = parseProp65(fixture)
  const r = out.find((x) => x.cas.includes('13463-67-7'))!
  expect(r.name).toBe('Titanium dioxide')
  expect(r.listing).toMatchObject({
    source: 'PROP65',
    classification: 'Listed as causing cancer',
    level: 'possible',
    qualifier: 'airborne, unbound particles of respirable size',
    url: 'https://oehha.ca.gov/proposition-65/proposition-65-list',
  })
  expect(out.some((x) => x.name === 'Toluene')).toBe(false) // developmental only
  expect(out.find((x) => x.name === 'Benzene')).toBeDefined() // cancer among several toxicities
})

test('Prop 65: year comes from Date Listed, null when absent', () => {
  const out = parseProp65(fixture)
  expect(out.find((x) => x.name === 'Titanium dioxide')!.listing.year).toBe(2011)
  expect(out.find((x) => x.name === 'Acetaldehyde')!.listing.year).toBeNull()
})

test('Prop 65: a name without a trailing parenthetical has no qualifier key', () => {
  expect(parseProp65(fixture).find((x) => x.name === 'Benzene')!.listing).not.toHaveProperty('qualifier')
})

test('Prop 65: rows with missing cells do not throw and are skipped when nameless', () => {
  expect(parseProp65([{ 'Type of Toxicity': 'cancer' }, { Chemical: 'X' }])).toEqual([])
})
