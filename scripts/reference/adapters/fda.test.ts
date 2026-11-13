import { KEEP_UPPER, parseFda, readableName } from './fda'

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
  expect(out.map((r) => r.name)).toEqual(['Sulfuric acid', 'Acrylamide', 'Something', 'Diethyl pyrocarbonate', 'Methyl acrylate--dvb-(Deg), terpolymer', 'Mixed Case', 'No-dash plain'])
})

test('FDA: an all-capitals name becomes sentence case; a mixed-case name is left alone', () => {
  const out = parseFda([{ Substance: ' SULFURIC ACID' }, { Substance: 'Vitamin B12 (cyanocobalamin)' }, { Substance: ' 2-ETHYLHEXANOL' }])
  expect(out.map((r) => r.name)).toEqual(['Sulfuric acid', 'Vitamin B12 (cyanocobalamin)', '2-ethylhexanol'])
})

test('FDA: the status code is kept as spelled-out text in fdaStatus, never dropped', () => {
  const out = parseFda([
    { 'CAS Reg No (or other ID)': ' 977016-96-8', Substance: ' CYCLAMATE--PROHIBITED', 'Used for (Technical Effect)': ' NON-NUTRITIVE SWEETENER' },
    { 'CAS Reg No (or other ID)': ' 91-64-5', Substance: ' COUMARIN--PROHIBITED', 'Used for (Technical Effect)': ' FLAVORING AGENT OR ADJUVANT' },
    { 'CAS Reg No (or other ID)': ' 4680-78-8', Substance: ' FD&C GREEN NO. 1--DELISTED', 'Used for (Technical Effect)': '' },
    { Substance: 'X--PROHIBITED WITH EXCEPTIONS' },
    { Substance: 'Y--NLFG' },
    { Substance: 'Z--ODDCODE' },
    { Substance: 'Plain' },
  ])
  expect(out.map((r) => r.fdaStatus)).toEqual([
    'prohibited in food',
    'prohibited in food',
    'delisted (no longer permitted)',
    'prohibited in food, with exceptions',
    'not listed for general food use',
    'ODDCODE',
    undefined,
  ])
  expect(out[2].name).toBe('FD&C green No. 1')
})

test('readableName: restores capitals the plain lower-casing would lose', () => {
  const cases: [string, string][] = [
    ['FD&C YELLOW NO. 5', 'FD&C yellow No. 5'],
    ['VITAMIN B-12', 'Vitamin B-12'],
    ['EDTA, DISODIUM', 'EDTA, disodium'],
    ['CARROT, OIL (DAUCUS CAROTA L.)', 'Carrot, oil (Daucus carota L.)'],
    ['DL-PHENYLALANINE', 'DL-phenylalanine'],
    ['METHYL N,N-DIMETHYLANTHRANILATE', 'Methyl N,N-dimethylanthranilate'],
    ["AMINOGLYCOSIDE 3'-PHOSPHOTRANSFERASE II", "Aminoglycoside 3'-phosphotransferase II"],
    ['SULFURIC ACID', 'Sulfuric acid'],
    ['PEG-8 STEARATE', 'PEG-8 stearate'],
  ]
  for (const [input, expected] of cases) expect(readableName(input)).toBe(expected)
  expect(KEEP_UPPER).toContain('EDTA')
})
