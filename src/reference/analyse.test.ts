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
      aliases: ['formalin'],
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
    entry({
      id: 'cas:100-42-5',
      name: 'Styrene',
      cas: ['100-42-5'],
      listings: [{ source: 'NTP', classification: 'RAHC', level: 'possible', year: null, url: 'u' }],
    }),
    entry({
      id: 'cas:75-01-4',
      name: 'Vinyl chloride',
      cas: ['75-01-4'],
      listings: [{ source: 'NTP', classification: 'Known', level: 'strong', year: null, url: 'u' }],
    }),
    entry({ id: 'cas:108-05-4', name: 'Vinyl acetate' }),
    entry({ id: 'name:glycerin', name: 'Glycerin' }),
    entry({ id: 'name:soy lecithin', name: 'Soy lecithin' }),
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
test('slash alternatives naming different substances are not recognised, never the worst or best of them', () => {
  const r = analyseIngredient('Water/Formaldehyde', idx)
  expect(r.verdict).toBe('not_recognised')
  expect(r.matches).toEqual([{ key: 'water', verdict: 'not_recognised', entry: null }])
})
test('a copolymer is not split on "/": it is one substance, matched only as a whole', () => {
  expect(analyseIngredient('Styrene/Acrylates Copolymer', idx).verdict).toBe('not_recognised')
  expect(analyseIngredient('Vinyl Chloride/Vinyl Acetate Copolymer', idx).verdict).toBe('not_recognised')
  expect(analyseIngredient('Acrylates/C10-30 Alkyl Acrylate Crosspolymer', idx).verdict).toBe('not_recognised')
  expect(analyseIngredient('Thickener (Styrene/Acrylates Polymer)', idx).verdict).toBe('not_recognised')
})
test('slash alternatives where only one is known resolve to it', () =>
  expect(analyseIngredient('Aqua/Water/Eau', idx).verdict).toBe('no_known_concern'))
test('slash alternatives that are all names of one entry resolve to that entry', () => {
  const r = analyseIngredient('Formalin/Formaldehyde', idx)
  expect(r.verdict).toBe('watch_strong')
  expect(r.matches.map((m) => m.entry?.id)).toEqual(['cas:50-00-0'])
})
test('analyse keeps input order', () =>
  expect(analyse(['Water', 'Formaldehyde', 'Xyzzium'], idx).map((r) => r.verdict)).toEqual([
    'no_known_concern',
    'watch_strong',
    'not_recognised',
  ]))
test('SEVERITY is the display order', () =>
  expect(SEVERITY).toEqual(['watch_strong', 'watch_possible', 'not_recognised', 'no_known_concern']))

test('a "Function: name" prefix is looked past; the label text is kept as the input', () => {
  const cases: [string, string, string][] = [
    ['Preservative: Formaldehyde', 'watch_strong', 'cas:50-00-0'],
    ['Colour: Titanium Dioxide', 'watch_possible', 'cas:13463-67-7'],
    ['Emulsifier: Soy Lecithin', 'no_known_concern', 'name:soy lecithin'],
    ['Acidity Regulator:Glycerin', 'no_known_concern', 'name:glycerin'],
  ]
  for (const [input, verdict, id] of cases) {
    const r = analyseIngredient(input, idx)
    expect(r).toMatchObject({ input, verdict })
    expect(r.matches[0].entry?.id).toBe(id)
  }
})
test('a prefixed name that is not known stays not recognised; a long prefix is not treated as a function', () => {
  expect(analyseIngredient('Preservative: Xyzzium', idx).verdict).toBe('not_recognised')
  expect(analyseIngredient('Some other long thing: Formaldehyde', idx).verdict).toBe('not_recognised')
})
