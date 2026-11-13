import { parseENumbers } from './eNumbers'

// FIXTURE, NOT REAL DATA: invented-format rows to exercise the adapter only.
const fixture: Record<string, string>[] = [
  { E: 'E 171', Name: 'Titanium dioxide' },
  { E: 'e330', Name: ' Citric acid ' },
  { E: '', Name: 'No number' },
  { E: 'E 999', Name: '' },
]

test('E numbers: the number becomes an alias in the normalised "e171" form', () => {
  expect(parseENumbers(fixture)[0]).toEqual({
    name: 'Titanium dioxide',
    aliases: ['e171'],
    cas: [],
    functionNote: '',
    euCosmeticsBanned: false,
  })
  expect(parseENumbers(fixture)[1]).toMatchObject({ name: 'Citric acid', aliases: ['e330'] })
})

test('E numbers: rows missing the number or the name are skipped; missing cells do not throw', () => {
  expect(parseENumbers(fixture)).toHaveLength(2)
  expect(parseENumbers([{ Name: 'X' }, { E: 'E1' }])).toEqual([])
})
