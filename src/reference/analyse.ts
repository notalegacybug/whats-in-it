import { normalizeName } from '../ingredients/normalize'
import { matchGroups } from '../ingredients/split'
import type { RefIndex } from './index'
import type { IngredientResult, Match, RefEntry, Verdict } from './types'

/** Most to least concerning; also the display order. */
export const SEVERITY: Verdict[] = ['watch_strong', 'watch_possible', 'not_recognised', 'no_known_concern']

const FUNCTION_PREFIX = /^\s*[a-z][\w&'-]*(?:\s+[a-z][\w&'-]*)?\s*:\s*(.+)$/i

function mostSevere(verdicts: Verdict[]): Verdict {
  return SEVERITY.find((v) => verdicts.includes(v)) ?? 'not_recognised'
}

function entryVerdict(entry: RefEntry): Verdict {
  if (entry.listings.length === 0) return 'no_known_concern'
  return entry.listings.some((l) => l.level === 'strong') ? 'watch_strong' : 'watch_possible'
}

function hit(key: string, index: RefIndex): Match | null {
  const entry = index.byKey.get(key)
  return entry ? { key, verdict: entryVerdict(entry), entry } : null
}

export function analyseIngredient(input: string, index: RefIndex): IngredientResult {
  const { whole, groups, kinds } = matchGroups(input)

  const wholeHit = whole ? hit(whole, index) : null
  if (wholeHit) return { input, verdict: wholeHit.verdict, matches: [wholeHit] }

  // Food labels often name the function first ("Preservative: Formaldehyde"); check what follows.
  // If that fails, the colon may be photo noise inside one name ("SYNTHETIC: FLUORPHLOGOPITE").
  const prefixed = FUNCTION_PREFIX.exec(input)
  if (prefixed) {
    const rest = { ...analyseIngredient(prefixed[1], index), input }
    if (rest.verdict !== 'not_recognised') return rest
    const joined = hit(normalizeName(input.replace(':', ' ')), index)
    return joined ? { input, verdict: joined.verdict, matches: [joined] } : rest
  }

  // Alternatives resolve only if every hit is the same entry ("Water/Formaldehyde" is unrecognised).
  const matches: Match[] = groups.map((alternatives) => {
    const hits = alternatives.map((k) => hit(k, index)).filter((m): m is Match => m !== null)
    const sameEntry = hits.length > 0 && hits.every((m) => m.entry === hits[0].entry)
    return sameEntry ? hits[0] : { key: alternatives[0], verdict: 'not_recognised', entry: null }
  })

  // The main name and a single bracketed synonym name one thing: if either matched, the other needn't.
  const named = (i: number) => kinds[i] !== 'part'
  const nameMatched = matches.some((m, i) => named(i) && m.entry)
  const kept = matches.filter((m, i) => !(nameMatched && named(i) && !m.entry))

  return { input, verdict: mostSevere(kept.map((m) => m.verdict)), matches: kept }
}

export function analyse(ingredients: string[], index: RefIndex): IngredientResult[] {
  return ingredients.map((i) => analyseIngredient(i, index))
}
