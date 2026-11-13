import { distance } from 'fastest-levenshtein'
import { normalizeName } from '../ingredients/normalize'
import type { RefIndex } from './index'
import type { RefEntry } from './types'

const MIN_LENGTH = 5
const MAX_DISTANCE = 2
const MAX_RATIO = 0.2

const MAX_EXTRA_WORDS = 3
// Words that change the substance ("Hydrolyzed", "PEG-50", "Sodium"), unlike a plant genus ("Panax").
const MODIFIER = /[^a-z]|(?:yzed|ized|ated|yl|oyl|onium)$/
const MODIFIER_WORDS = new Set(['sodium', 'potassium', 'calcium', 'magnesium', 'zinc', 'ammonium', 'disodium', 'trisodium', 'hydrolysed'])
const isPlainPrefix = (w: string) => !MODIFIER.test(w) && !MODIFIER_WORDS.has(w)

// ending -> (entry id -> the full key that ends with it)
const endings = new WeakMap<RefIndex, Map<string, Map<string, string>>>()

// Built once per reference: every 2+ word ending of a name, reached through plain prefix words only.
function endingIndex(index: RefIndex): Map<string, Map<string, string>> {
  let map = endings.get(index)
  if (map) return map
  map = new Map()
  for (const key of index.keys) {
    if (key.includes('/')) continue // blends name several substances
    const words = key.split(' ')
    for (let extra = 1; extra <= MAX_EXTRA_WORDS && words.length - extra >= 2; extra++) {
      if (!isPlainPrefix(words[extra - 1])) break
      const ending = words.slice(extra).join(' ')
      if (!map.has(ending)) map.set(ending, new Map())
      const byEntry = map.get(ending)!
      const id = index.byKey.get(key)!.id
      if (!byEntry.has(id)) byEntry.set(id, key)
    }
  }
  endings.set(index, map)
  return map
}

const titleCase = (key: string) => key.replace(/(^|[\s(/-])([a-z])/g, (_, sep: string, c: string) => sep + c.toUpperCase())

// "Ginseng Root Extract" -> "Panax Ginseng Root Extract", only when exactly one substance fits.
// Returns the matched full name, not the entry's display name, which may be a merged sibling's.
export function fullNameEnding(input: string, index: RefIndex): { entry: RefEntry; name: string } | null {
  const text = normalizeName(input)
  if (text.split(' ').length < 2) return null
  const byEntry = endingIndex(index).get(text)
  if (!byEntry || byEntry.size !== 1) return null
  const [[id, key]] = byEntry
  const entry = index.entries.get(id)
  return entry ? { entry, name: titleCase(key) } : null
}

// Suggestion only, never changes a verdict. Ties go to a listed entry, then alphabetical key.
export function suggest(input: string, index: RefIndex): string | null {
  const text = normalizeName(input)
  if (text.length < MIN_LENGTH || index.byKey.has(text)) return null
  const fuller = fullNameEnding(text, index)
  if (fuller) return fuller.name

  const limit = Math.min(MAX_DISTANCE, Math.floor(text.length * MAX_RATIO))
  let best: { key: string; dist: number; listed: boolean } | null = null

  for (const key of index.keys) {
    // Length gap is a lower bound on edit distance, so skip without computing it.
    if (Math.abs(key.length - text.length) > limit) continue
    const dist = distance(text, key)
    if (dist > limit) continue
    const listed = (index.byKey.get(key)?.listings.length ?? 0) > 0
    if (
      !best ||
      dist < best.dist ||
      (dist === best.dist && listed && !best.listed) ||
      (dist === best.dist && listed === best.listed && key < best.key)
    ) {
      best = { key, dist, listed }
    }
  }
  return best ? (index.byKey.get(best.key)?.name ?? null) : null
}
