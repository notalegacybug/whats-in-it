import type { RefEntry, Reference } from '../../src/reference/types'
import { findKeyCollisions } from './collisions'

const entry = (id: string, name: string, extra: Partial<RefEntry> = {}): RefEntry => ({
  id,
  name,
  aliases: [],
  cas: [],
  listings: [],
  ...extra,
})
const ref = (entries: RefEntry[]): Reference => ({ version: 'v', builtAt: 'x', entries })

test('a clean reference has no collisions', () => {
  expect(findKeyCollisions(ref([entry('cas:50-00-0', 'Formaldehyde', { cas: ['50-00-0'], aliases: ['formalin'] }), entry('name:aqua', 'Aqua')]))).toEqual([])
})

test('two entries sharing a normalised name collide', () => {
  const out = findKeyCollisions(ref([entry('cas:1-1-1', 'Talc'), entry('cas:2-2-2', ' TALC.')]))
  expect(out).toEqual([{ key: 'talc', ids: ['cas:1-1-1', 'cas:2-2-2'] }])
})

test('a secondary CAS equal to another entry CAS collides', () => {
  const out = findKeyCollisions(
    ref([entry('cas:13463-67-7', 'Titanium dioxide', { cas: ['13463-67-7', '1317-70-0'] }), entry('cas:1317-70-0', 'Anatase', { cas: ['1317-70-0'] })]),
  )
  expect(out).toEqual([{ key: '1317-70-0', ids: ['cas:1317-70-0', 'cas:13463-67-7'] }])
})

test('one entry repeating a key (name equal to an alias) is not a collision', () => {
  expect(findKeyCollisions(ref([entry('cas:1-1-1', 'Talc', { aliases: ['talc'] })]))).toEqual([])
})
