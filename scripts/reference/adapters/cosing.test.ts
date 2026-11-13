import { parseCosing } from './cosing'

// FIXTURE, NOT REAL DATA: cosing.csv could not be downloaded; column names are assumptions.
const fixture: Record<string, string>[] = [
  { 'INCI name': 'TITANIUM DIOXIDE', 'CAS No': '13463-67-7', Function: 'COLORANT, OPACIFYING', Restriction: 'V/143' },
  { 'INCI name': 'CI 77891', 'CAS No': '13463-67-7 / 1317-70-0', Function: 'COLORANT', Restriction: '' },
  { 'INCI name': 'GLYCERIN', 'CAS No': '56-81-5', Function: 'HUMECTANT', Restriction: '' },
  { 'INCI name': 'LEAD ACETATE', 'CAS No': '301-04-2', Function: '', Restriction: ' II/92' },
  { 'INCI name': 'AQUA', 'CAS No': '', Function: 'SOLVENT', Restriction: '' },
  { 'INCI name': '', 'CAS No': '1-1-1', Function: 'X', Restriction: '' },
]

test('CosIng: name, valid CAS numbers (also when separated by "/") and function', () => {
  const out = parseCosing(fixture)
  expect(out[0]).toEqual({
    name: 'TITANIUM DIOXIDE',
    aliases: [],
    cas: ['13463-67-7'],
    functionNote: 'colorant, opacifying',
    euCosmeticsBanned: false,
  })
  expect(out[1].cas).toEqual(['13463-67-7', '1317-70-0'])
})

test('CosIng: banned only when the restriction starts with "II/"', () => {
  const out = parseCosing(fixture)
  expect(out.find((r) => r.name === 'LEAD ACETATE')!.euCosmeticsBanned).toBe(true)
  expect(out.find((r) => r.name === 'GLYCERIN')!.euCosmeticsBanned).toBe(false)
  expect(out.find((r) => r.name === 'TITANIUM DIOXIDE')!.euCosmeticsBanned).toBe(false)
})

test('CosIng: no CAS is kept as []; nameless rows and missing cells are skipped without throwing', () => {
  const out = parseCosing(fixture)
  expect(out.find((r) => r.name === 'AQUA')!.cas).toEqual([])
  expect(out).toHaveLength(5)
  expect(parseCosing([{ Function: 'x' }])).toEqual([])
})
