import { parseCas } from './cas'

test('parseCas keeps only valid numbers', () => {
  expect(parseCas('50-00-0; 13463-67-7')).toEqual(['50-00-0', '13463-67-7'])
  expect(parseCas('50-00-1')).toEqual([]) // bad check digit
  expect(parseCas('')).toEqual([])
})

test('parseCas splits on commas and newlines, trims, and de-duplicates', () => {
  expect(parseCas('50-00-0, 13463-67-7\n 50-00-0')).toEqual(['50-00-0', '13463-67-7'])
  expect(parseCas('1332-21-4; 12172-73-5; 12001-29-5; 12001-28-4')).toHaveLength(4)
})

test('parseCas ignores placeholders and malformed cells', () => {
  expect(parseCas('NA')).toEqual([])
  expect(parseCas('-')).toEqual([])
  expect(parseCas('12-34')).toEqual([])
  expect(parseCas('abc-de-f')).toEqual([])
})
