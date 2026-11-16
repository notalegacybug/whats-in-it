import { parseEdLists } from './edLists'

// FIXTURE, NOT REAL DATA: invented rows in the edlists.csv layout.
const row = (o: Record<string, string>) => ({ 'Environmental effects': '', Status: 'x', 'Regulatory field': '', ...o })
const rows = [
  row({ Name: 'Butyl 4-hydroxybenzoate; Butylparaben', CAS: '94-26-8', 'Health effects': 'Yes', Year: '2019', List: 'List I' }),
  row({ Name: 'Butyl 4-hydroxybenzoate; Butylparaben', CAS: '94-26-8', 'Health effects': 'Yes', Year: '2020', List: 'List I' }),
  row({ Name: 'Fish Harmer', CAS: '1-1-1', 'Health effects': '', 'Environmental effects': 'Yes', Year: '2018', List: 'List I' }),
  row({ Name: 'Twin Musk', CAS: '21145-77-7, 1506-02-1', 'Health effects': 'Yes', Year: '2020', List: 'List II' }),
  row({ Name: 'National One', CAS: '50-00-0', 'Health effects': 'Yes', Year: '2021', List: 'List III' }),
]

test('ED lists: human-health rows only, one hormone listing per name and CAS, latest year', () => {
  const out = parseEdLists(rows)
  expect(out.map((r) => [r.name, r.cas[0], r.listing.level, r.listing.year])).toEqual([
    ['Butyl 4-hydroxybenzoate', '94-26-8', 'strong', 2020],
    ['Butylparaben', '94-26-8', 'strong', 2020],
    ['Twin Musk', '21145-77-7', 'possible', 2020],
    ['Twin Musk', '1506-02-1', 'possible', 2020],
    ['National One', '50-00-0', 'possible', 2021],
  ])
  expect(out.every((r) => r.listing.hazard === 'hormone' && r.listing.source === 'ED_LISTS')).toBe(true)
  expect(out[0].listing.classification).toBe('Identified as an endocrine disruptor at EU level')
  expect(out[2].listing.classification).toBe('Under EU evaluation for endocrine disruption')
  expect(out[4].listing.classification).toBe('Considered an endocrine disruptor by a national authority')
})
