import { parseProp65 } from './prop65'

const row = (chemical: string, toxicity: string, cas: string, date: string): Record<string, string> => ({
  Chemical: chemical,
  'Type of Toxicity': toxicity,
  'CAS No.': cas,
  'Date Listed': date,
})

// FIXTURE, NOT REAL DATA: OEHHA blocked download; rows follow the documented column layout.
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
  const cancer = out.filter((x) => (x.listing.hazard ?? 'cancer') === 'cancer')
  expect(cancer.some((x) => x.name === 'Toluene')).toBe(false) // developmental only
  expect(cancer.find((x) => x.name === 'Benzene')).toBeDefined() // cancer among several toxicities
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

test('Prop 65: only a route/form parenthetical becomes the qualifier; other brackets stay in the name', () => {
  const out = parseProp65([
    row('Chromium (hexavalent compounds)', 'cancer', '18540-29-9', 'February 27, 1987'),
    row('Titanium dioxide (airborne, unbound particles of respirable size)', 'cancer', '13463-67-7', 'September 2, 2011'),
  ])
  expect(out[0].name).toBe('Chromium (hexavalent compounds)')
  expect(out[0].listing).not.toHaveProperty('qualifier')
  expect(out[1].name).toBe('Titanium dioxide')
  expect(out[1].listing.qualifier).toBe('airborne, unbound particles of respirable size')
})


test('Prop 65: reproductive rows become one reproductive listing, separate from cancer', () => {
  const out = parseProp65(fixture)
  const toluene = out.filter((x) => x.name === 'Toluene')
  expect(toluene.map((x) => x.listing)).toEqual([
    expect.objectContaining({
      source: 'PROP65',
      hazard: 'reproductive',
      classification: 'Listed as causing developmental or reproductive harm (developmental, female, male)',
      level: 'possible',
      year: 1991,
    }),
  ])
  const benzene = out.filter((x) => x.name === 'Benzene').map((x) => x.listing.hazard ?? 'cancer')
  expect(benzene.sort()).toEqual(['cancer', 'reproductive'])
  expect(out.filter((x) => x.name === 'Formaldehyde (gas)').map((x) => x.listing.hazard ?? 'cancer')).toEqual(['cancer'])
})

test('Prop 65: a chemical with reproductive endpoints on separate rows gets one merged listing', () => {
  const out = parseProp65([row('Toluene', 'developmental', '108-88-3', '1991-01-01'), row('Toluene', 'female', '108-88-3', '2009-08-07')])
  expect(out.map((x) => x.listing)).toEqual([
    expect.objectContaining({ hazard: 'reproductive', classification: 'Listed as causing developmental or reproductive harm (developmental, female)', year: 2009 }),
  ])
})
