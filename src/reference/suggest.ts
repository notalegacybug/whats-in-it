import { distance } from 'fastest-levenshtein'
import { normalizeName } from '../ingredients/normalize'
import type { RefIndex } from './index'

const MIN_LENGTH = 5
const MAX_DISTANCE = 2
const MAX_RATIO = 0.2

/**
 * "Did you mean" for a misread ingredient name. Returns the display name of the entry owning the
 * nearest key, or null. Suggestion only: it never changes a verdict.
 * Ties on distance go to a key whose entry is listed, then alphabetical key order.
 */
export function suggest(input: string, index: RefIndex): string | null {
  const text = normalizeName(input)
  if (text.length < MIN_LENGTH || index.byKey.has(text)) return null

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
