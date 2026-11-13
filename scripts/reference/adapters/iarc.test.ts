import { parseIarc } from './iarc'

const row = (
  cas: string,
  agent: string,
  group: string,
  year: string,
  info = '',
): Record<string, string> => ({
  'CAS No.': cas,
  Agent: agent,
  Group: group,
  'Volume publication year': year,
  'Additional information': info,
})

// Rows copied from data/sources/iarc.csv (IARC list of classifications, Volumes 1-142). That file is
// git-ignored (reuse terms pending), so this provenance cannot be checked on a clean checkout.
const fixture: Record<string, string>[] = [
  row('50-00-0', 'Formaldehyde', '1', '2012'),
  row('13463-67-7', 'Titanium dioxide', '2B', '2010'),
  row('58-08-2', 'Caffeine', '3', '1991'),
  row(
    '540-73-8',
    '1,2-Dimethylhydrazine',
    '2A',
    '1999',
    'NB Overall evaluation upgraded to Group 2A with supporting evidence from other relevant data',
  ),
  row('14807-96-6', 'Talc-based body powder (perineal use of) (see Talc)', '', '2010'),
  row('14807-96-6', 'Talc', '2A', '2025 online'),
  row('15972-60-8', 'Alachlor', '2A', 'In prep.'),
  row('', 'Aloe vera, whole leaf extract', '2B', '2016'),
]

test('IARC: groups 1, 2A, 2B kept with levels; group 3 and unclassified dropped', () => {
  const out = parseIarc(fixture)
  expect(out.find((r) => r.name === 'Formaldehyde')!.listing).toMatchObject({
    source: 'IARC',
    classification: 'Group 1',
    level: 'strong',
    year: 2012,
    url: 'https://monographs.iarc.who.int/list-of-classifications',
  })
  const tio2 = out.find((r) => r.name === 'Titanium dioxide')!.listing
  expect(tio2.level).toBe('possible')
  expect(tio2.classification).toBe('Group 2B')
  expect(out.some((r) => r.listing.classification === 'Group 3')).toBe(false)
  expect(out.some((r) => r.name.startsWith('Talc-based'))).toBe(false)
})

test('IARC: "Additional information" becomes the qualifier', () => {
  const out = parseIarc(fixture)
  expect(out.find((r) => r.name === '1,2-Dimethylhydrazine')!.listing.qualifier).toMatch(
    /^NB Overall evaluation upgraded/,
  )
  expect(out.find((r) => r.name === 'Formaldehyde')!.listing).not.toHaveProperty('qualifier')
})

test('IARC: year is the latest four-digit year in the cell, null when there is none', () => {
  const out = parseIarc(fixture)
  expect(out.find((r) => r.name === 'Talc')!.listing.year).toBe(2025)
  expect(out.find((r) => r.name === 'Alachlor')!.listing.year).toBeNull()
})

test('IARC: CAS parsed, and kept as an empty array when absent', () => {
  const out = parseIarc(fixture)
  expect(out.find((r) => r.name === 'Formaldehyde')!.cas).toEqual(['50-00-0'])
  expect(out.find((r) => r.name.startsWith('Aloe vera'))!.cas).toEqual([])
})

test('IARC: rows with missing cells or no name do not throw and are skipped', () => {
  expect(parseIarc([{ Agent: '', Group: '1' }, { Group: '2B' }, { Agent: 'Benzene' }])).toEqual([])
})

test('IARC: "(see also ...)" cross-references are removed from the name', () => {
  const out = parseIarc([
    row('62-53-3', 'Aniline (see also Aniline hydrochloride)', '2A', '2021 online'),
    row('', 'Automotive gasoline (see also Gasoline engine exhaust, and Aviation gasoline)', '1', '2026 online'),
  ])
  expect(out.map((r) => r.name)).toEqual(['Aniline', 'Automotive gasoline'])
})

test('IARC: a "(see ...)" reference becomes a qualifier, joined with an existing one by "; "', () => {
  const out = parseIarc([
    row('62-53-3', 'Aniline (see also Aniline hydrochloride)', '2A', '2021 online'),
    { ...row('14807-96-6', 'Talc-based body powder (see Talc)', '2B', '2010'), 'Additional information': 'perineal use' },
  ])
  expect(out[0].listing.qualifier).toBe('Listed as part of: Aniline hydrochloride')
  expect(out[1].listing.qualifier).toBe('perineal use; Listed as part of: Talc')
})
