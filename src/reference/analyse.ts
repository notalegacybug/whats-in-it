import { matchGroups } from '../ingredients/split'
import type { RefIndex } from './index'
import type { IngredientResult, Match, RefEntry, Verdict } from './types'

/** Most to least concerning; also the display order. */
export const SEVERITY: Verdict[] = ['watch_strong', 'watch_possible', 'not_recognised', 'no_known_concern']

const rank = (v: Verdict) => SEVERITY.indexOf(v)

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
  const { whole, groups } = matchGroups(input)

  // If the whole item is itself a known key (name, alias or CAS), that is the single match.
  const wholeHit = whole ? hit(whole, index) : null
  if (wholeHit) return { input, verdict: wholeHit.verdict, matches: [wholeHit] }

  // Alternatives ("A/B") need one hit; each bracketed part must be recognised on its own.
  const matches: Match[] = groups.map((alternatives) => {
    const hits = alternatives.map((k) => hit(k, index)).filter((m): m is Match => m !== null)
    if (hits.length === 0) return { key: alternatives[0], verdict: 'not_recognised', entry: null }
    return hits.reduce((best, m) => (rank(m.verdict) < rank(best.verdict) ? m : best))
  })

  return { input, verdict: mostSevere(matches.map((m) => m.verdict)), matches }
}

export function analyse(ingredients: string[], index: RefIndex): IngredientResult[] {
  return ingredients.map((i) => analyseIngredient(i, index))
}
