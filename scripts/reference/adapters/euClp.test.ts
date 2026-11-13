import { parseEuClp } from './euClp'

const row = (name: string, cas: string, hazard: string): Record<string, string> => ({
  'International Chemical Identification': name,
  'CAS No': cas,
  'Hazard Class and Category Code(s)': hazard,
})

// FIXTURE, NOT REAL DATA: ECHA blocked download; rows follow the documented column layout.
const fixture: Record<string, string>[] = [
  row('benzene', '71-43-2', 'Flam. Liq. 2\nCarc. 1A\nMuta. 1B'),
  row('formaldehyde', '50-00-0', 'Carc. 1B'),
  row('titanium dioxide', '13463-67-7', 'Carc. 2 (inhalation)'),
  row('silicon carbide (fibres)', '409-21-2', 'Carc. 2'),
  row('toluene', '108-88-3', 'Flam. Liq. 2; Repr. 2'),
  row('cobalt dichloride (inhalation)', '7646-79-9', 'Carc. 1B'),
]

test('EU CLP: Carc. 1A/1B strong, Carc. 2 possible, rows without Carc. dropped, year = annexYear', () => {
  const out = parseEuClp(fixture, 2024)
  expect(out.find((r) => r.name === 'benzene')!.listing).toMatchObject({
    source: 'EU_CLP',
    classification: 'Carc. 1A',
    level: 'strong',
    year: 2024,
    url: 'https://echa.europa.eu/information-on-chemicals/annex-vi-to-clp',
  })
  expect(out.find((r) => r.name === 'formaldehyde')!.listing).toMatchObject({
    classification: 'Carc. 1B',
    level: 'strong',
  })
  expect(out.find((r) => r.name === 'silicon carbide')!.listing).toMatchObject({
    classification: 'Carc. 2',
    level: 'possible',
  })
  expect(out.some((r) => r.name === 'toluene')).toBe(false)
})

test('EU CLP: a route in the classification cell goes to the qualifier', () => {
  const r = parseEuClp(fixture, 2024).find((x) => x.name === 'titanium dioxide')!
  expect(r.listing.classification).toBe('Carc. 2')
  expect(r.listing.qualifier).toBe('inhalation')
})

test('EU CLP: a trailing parenthetical in the name goes to the qualifier', () => {
  const out = parseEuClp(fixture, 2024)
  expect(out.find((r) => r.name === 'silicon carbide')!.listing.qualifier).toBe('fibres')
  expect(out.find((r) => r.name === 'cobalt dichloride')!.listing.qualifier).toBe('inhalation')
})

test('EU CLP: CAS parsed; rows with missing cells do not throw', () => {
  const out = parseEuClp(fixture, 2024)
  expect(out.find((r) => r.name === 'benzene')!.cas).toEqual(['71-43-2'])
  expect(
    parseEuClp(
      [
        { 'Hazard Class and Category Code(s)': 'Carc. 1B' },
        { 'International Chemical Identification': 'x' },
      ],
      2024,
    ),
  ).toEqual([])
})

test('EU CLP: a non-route parenthetical stays in the name', () => {
  const out = parseEuClp([row('chromium (hexavalent compounds)', '18540-29-9', 'Carc. 1B')], 2024)
  expect(out[0].name).toBe('chromium (hexavalent compounds)')
  expect(out[0].listing).not.toHaveProperty('qualifier')
})
