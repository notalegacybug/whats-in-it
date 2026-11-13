import { buildIndex } from './index'
import { suggest } from './suggest'
import type { Reference, RefEntry } from './types'

const entry = (e: Partial<RefEntry> & Pick<RefEntry, 'id' | 'name'>): RefEntry => ({
  aliases: [],
  cas: [],
  listings: [],
  ...e,
})

const listing = { source: 'IARC', classification: '1', level: 'strong', year: 2012, url: 'u' } as const

const ref: Reference = {
  version: 'test',
  builtAt: '2026-01-01',
  entries: [
    entry({ id: 'cas:50-00-0', name: 'Formaldehyde', cas: ['50-00-0'], listings: [listing] }),
    entry({ id: 'name:glycerin', name: 'Glycerin' }),
    entry({ id: 'name:water', name: 'Water', aliases: ['aqua'] }),
    // Equal distance from 'abcdefx': the alphabetically earlier one is not listed.
    entry({ id: 'name:abcdefg', name: 'Abcdefg' }),
    entry({ id: 'name:abcdefh', name: 'Abcdefh', listings: [listing] }),
  ],
}
const idx = buildIndex(ref)

test('suggests the closest name for a misread', () => {
  expect(suggest('Forma1dehyde', idx)).toBe('Formaldehyde')
  expect(suggest('Glycerln', idx)).toBe('Glycerin')
})
test('an exact key gets no suggestion', () => expect(suggest('Formaldehyde', idx)).toBeNull())
test('nothing close gets no suggestion', () => expect(suggest('Xyzzium', idx)).toBeNull())
test('input under 5 characters gets no suggestion', () => expect(suggest('watr', idx)).toBeNull())
test('a near-miss of an alias suggests the entry name', () => expect(suggest('aquaa', idx)).toBe('Water'))
test('ties go to the listed entry, not alphabetical order', () =>
  expect(suggest('abcdefx', idx)).toBe('Abcdefh'))
test('empty or blank input returns null', () => {
  expect(suggest('', idx)).toBeNull()
  expect(suggest('   ', idx)).toBeNull()
})

describe('a common short name suggests the one full name it ends', () => {
  const names = [
    'Panax Ginseng Root Extract',
    'Hydrolyzed Ginseng Root Extract',
    'Hydrolyzed Panax Ginseng Root Extract',
    'Camellia Sinensis Leaf/Panax Ginseng Root Extract',
    'PEG-50 Shea Butter',
    'Hydrogenated Shea Butter',
    'Pelargonium Sidoides Root Extract',
    'Angelica Acutiloba Root Extract',
  ]
  const idx = buildIndex({ version: 't', builtAt: '2026-01-01', entries: names.map((name) => entry({ id: `name:${name}`, name })) })

  test('modified forms and blends are not counted, leaving one plant name', () => {
    expect(suggest('Ginseng Root Extract', idx)).toBe('Panax Ginseng Root Extract')
  })
  test('a generic ending that fits several plants suggests nothing', () => {
    expect(suggest('Root Extract', idx)).toBeNull()
  })
  test('only modified forms left means no suggestion', () => {
    expect(suggest('Shea Butter', idx)).toBeNull()
  })
})
