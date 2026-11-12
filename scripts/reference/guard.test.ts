import { checkSourceFile } from './guard'

const COLUMNS = { name: 'Name', cas: 'CAS' } as const

test('accepts a file with every expected header and at least one record', () => {
  expect(() => checkSourceFile('NTP', 'ntp.csv', ['Name', 'CAS', 'Extra'], COLUMNS, 3)).not.toThrow()
})

test('names each missing header, the file and the headers it did find', () => {
  expect(() => checkSourceFile('NTP', 'ntp.csv', ['Name', 'Other'], COLUMNS, 3)).toThrow(
    /NTP.*ntp\.csv.*missing.*"CAS".*found.*Name, Other/s,
  )
})

test('refuses a file that yields no records', () => {
  expect(() => checkSourceFile('NTP', 'ntp.csv', ['Name', 'CAS'], COLUMNS, 0)).toThrow(/NTP.*0 records/s)
})

test('a file with no header row at all fails as missing headers', () => {
  expect(() => checkSourceFile('NTP', 'ntp.csv', [], COLUMNS, 0)).toThrow(/missing.*"Name".*"CAS"/s)
})
