import { buildIndex } from './index'
import { analyse, analyseIngredient, SEVERITY } from './analyse'
import type { Reference, RefEntry } from './types'

const entry = (e: Partial<RefEntry> & Pick<RefEntry, 'id' | 'name'>): RefEntry => ({
  aliases: [],
  cas: [],
  listings: [],
  ...e,
})

const ref: Reference = {
  version: 'test',
  builtAt: '2026-01-01',
  entries: [
    entry({
      id: 'cas:50-00-0',
      name: 'Formaldehyde',
      cas: ['50-00-0'],
      listings: [{ source: 'IARC', classification: '1', level: 'strong', year: 2012, url: 'u' }],
    }),
    entry({
      id: 'cas:13463-67-7',
      name: 'Titanium dioxide',
      aliases: ['ci 77891', 'e171'],
      cas: ['13463-67-7'],
      listings: [{ source: 'IARC', classification: '2B', level: 'possible', year: 2010, url: 'u' }],
    }),
    entry({ id: 'name:water', name: 'Water', aliases: ['aqua', 'eau'] }),
    entry({ id: 'name:glycerin', name: 'Glycerin' }),
    entry({
      id: 'cas:1-1-1',
      name: 'Mixed thing',
      listings: [
        { source: 'IARC', classification: '2B', level: 'possible', year: null, url: 'u' },
        { source: 'EU_CLP', classification: 'Carc. 1B', level: 'strong', year: null, url: 'u' },
      ],
    }),
    entry({ id: 'name:dupe-first', name: 'Dupe', aliases: ['shared'] }),
    entry({
      id: 'name:dupe-second',
      name: 'Other',
      aliases: ['shared'],
      listings: [{ source: 'NTP', classification: 'RAHC', level: 'possible', year: null, url: 'u' }],
    }),
  ],
}
const idx = buildIndex(ref)

test('listed strong', () => expect(analyseIngredient('Formaldehyde', idx).verdict).toBe('watch_strong'))
test('alias inside brackets is found', () => {
  const r = analyseIngredient('Colour (E171)', idx)
  expect(r.verdict).toBe('watch_possible')
  expect(r.matches.find((m) => m.key === 'e171')?.entry?.id).toBe('cas:13463-67-7')
})
test('slash names resolve to one clear ingredient', () =>
  expect(analyseIngredient('Aqua/Water/Eau', idx).verdict).toBe('no_known_concern'))
test('unknown name is not recognised, never clear', () =>
  expect(analyseIngredient('Forma1dehyde', idx).verdict).toBe('not_recognised'))
test('a flagged part beats a clear part', () =>
  expect(analyseIngredient('Glycerin (Formaldehyde)', idx).verdict).toBe('watch_strong'))
test('an unrecognised part beats a clear part', () =>
  expect(analyseIngredient('Glycerin (Xyzzium)', idx).verdict).toBe('not_recognised'))
test('strongest listing sets the level', () =>
  expect(analyseIngredient('Mixed thing', idx).verdict).toBe('watch_strong'))
test('lookup by CAS number', () => expect(analyseIngredient('50-00-0', idx).verdict).toBe('watch_strong'))

test('first entry keeps a contested key', () =>
  expect(analyseIngredient('shared', idx).matches[0].entry?.id).toBe('name:dupe-first'))
test('empty input is not recognised and does not throw', () => {
  for (const s of ['', '   ']) {
    const r = analyseIngredient(s, idx)
    expect(r.verdict).toBe('not_recognised')
    expect(r.matches).toEqual([])
  }
})
test('unrecognised match carries the first alternative as key', () => {
  const m = analyseIngredient('Xyzzium/Plugh', idx).matches[0]
  expect(m).toEqual({ key: 'xyzzium', verdict: 'not_recognised', entry: null })
})
test('a slash alternative that hits is enough, most severe wins', () =>
  expect(analyseIngredient('Water/Formaldehyde', idx).verdict).toBe('watch_strong'))
test('analyse keeps input order', () =>
  expect(analyse(['Water', 'Formaldehyde', 'Xyzzium'], idx).map((r) => r.verdict)).toEqual([
    'no_known_concern',
    'watch_strong',
    'not_recognised',
  ]))
test('SEVERITY is the display order', () =>
  expect(SEVERITY).toEqual(['watch_strong', 'watch_possible', 'not_recognised', 'no_known_concern']))
