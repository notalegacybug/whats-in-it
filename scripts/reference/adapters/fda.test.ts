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
    name: 'GLYCERIN',
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
