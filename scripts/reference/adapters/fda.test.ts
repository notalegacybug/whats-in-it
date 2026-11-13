import { parseFda } from './fda'

// Rows shaped like data/sources/fda-saf.csv (FDA "Substances Added to Food", downloaded 2026-11-12):
// cells carry a leading space, effects are separated by "<br />" and listed in capitals.
const fixture: Record<string, string>[] = [
  {
    'CAS Reg No (or other ID)': ' 56-81-5',
    Substance: ' GLYCERIN',
    'Used for (Technical Effect)': ' HUMECTANT,<br /> SOLVENT OR VEHICLE,<br /> STABILIZER OR THICKENER',
  },
  { 'CAS Reg No (or other ID)': ' 977091-53-4', Substance: ' GLYCERIN, SYNTHETIC', 'Used for (Technical Effect)': ' HUMECTANT' },
  { 'CAS Reg No (or other ID)': '', Substance: ' ACAI BERRY EXTRACT', 'Used for (Technical Effect)': ' FLAVORING AGENT OR ADJUVANT' },
  { 'CAS Reg No (or other ID)': ' 50-00-0', Substance: '', 'Used for (Technical Effect)': ' FUMIGANT' },
]

test('FDA: substance, valid CAS and technical effects joined with ", " in lower case', () => {
  expect(parseFda(fixture)[0]).toEqual({
    name: 'Glycerin',
    aliases: [],
    cas: ['56-81-5'],
    functionNote: 'humectant, solvent or vehicle, stabilizer or thickener',
    euCosmeticsBanned: false,
  })
})

test('FDA: an ID that is not a valid CAS number is not kept; a blank CAS gives []', () => {
  const out = parseFda(fixture)
  expect(out[1].cas).toEqual([])
  expect(out[2].cas).toEqual([])
})

test('FDA: nameless rows and missing cells are skipped without throwing', () => {
  expect(parseFda(fixture)).toHaveLength(3)
  expect(parseFda([{ Substance: 'X' }])[0].functionNote).toBe('')
})

test('FDA: a trailing "--CODE" status suffix is removed from the name', () => {
  const names = ['SULFURIC ACID--NLFG', 'ACRYLAMIDE--PROHIBITED', 'SOMETHING--PROHIBITED WITH EXCEPTIONS', 'DIETHYL PYROCARBONATE-- PROHIBITED', 'METHYL ACRYLATE--DVB-(DEG), TERPOLYMER', 'Mixed Case--NLFG', 'NO-DASH PLAIN']
  const out = parseFda(names.map((n) => ({ Substance: n })))
  expect(out.map((r) => r.name)).toEqual(['Sulfuric acid', 'Acrylamide', 'Something', 'Diethyl pyrocarbonate', 'Methyl acrylate--dvb-(deg), terpolymer', 'Mixed Case', 'No-dash plain'])
})

test('FDA: an all-capitals name becomes sentence case; a mixed-case name is left alone', () => {
  const out = parseFda([{ Substance: ' SULFURIC ACID' }, { Substance: 'Vitamin B12 (cyanocobalamin)' }, { Substance: ' 2-ETHYLHEXANOL' }])
  expect(out.map((r) => r.name)).toEqual(['Sulfuric acid', 'Vitamin B12 (cyanocobalamin)', '2-ethylhexanol'])
})
