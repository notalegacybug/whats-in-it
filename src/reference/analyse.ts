import { normalizeName } from '../ingredients/normalize'
import { matchGroups } from '../ingredients/split'
import type { RefIndex } from './index'
import type { Hazard, IngredientResult, Listing, Match, RefEntry, Verdict } from './types'

/** Most to least concerning; also the display order. */
export const SEVERITY: Verdict[] = ['watch_strong', 'watch_possible', 'not_recognised', 'no_known_concern']

const FUNCTION_PREFIX = /^\s*[a-z][\w&'-]*(?:\s+[a-z][\w&'-]*)?\s*:\s*(.+)$/i

function mostSevere(verdicts: Verdict[]): Verdict {
  return SEVERITY.find((v) => verdicts.includes(v)) ?? 'not_recognised'
}

export const CANCER_ONLY: Hazard[] = ['cancer']

// Listings for the checks in use. Cancer is always on; hormone disruption only when the person asked for it.
export function listingsFor(entry: RefEntry, hazards: Hazard[]): Listing[] {
  return entry.listings.filter((l) => hazards.includes(l.hazard ?? 'cancer'))
}

function entryVerdict(entry: RefEntry, hazards: Hazard[]): Verdict {
  const listings = listingsFor(entry, hazards)
  if (listings.length === 0) return 'no_known_concern'
  return listings.some((l) => l.level === 'strong') ? 'watch_strong' : 'watch_possible'
}

export function analyseIngredient(input: string, index: RefIndex, hazards: Hazard[] = CANCER_ONLY): IngredientResult {
  const hit = (key: string): Match | null => {
    const entry = index.byKey.get(key)
    return entry ? { key, verdict: entryVerdict(entry, hazards), entry } : null
  }

  const { whole, groups, kinds } = matchGroups(input)

  const wholeHit = whole ? hit(whole) : null
  if (wholeHit) return { input, verdict: wholeHit.verdict, matches: [wholeHit] }

  // Food labels often name the function first ("Preservative: Formaldehyde"); check what follows.
  // If that fails, the colon may be photo noise inside one name ("SYNTHETIC: FLUORPHLOGOPITE").
  const prefixed = FUNCTION_PREFIX.exec(input)
  if (prefixed) {
    const rest = { ...analyseIngredient(prefixed[1], index, hazards), input }
    if (rest.verdict !== 'not_recognised') return rest
    const joined = hit(normalizeName(input.replace(':', ' ')))
    return joined ? { input, verdict: joined.verdict, matches: [joined] } : rest
  }

  // Alternatives resolve only if every hit is the same entry ("Water/Formaldehyde" is unrecognised).
  const matches: Match[] = groups.map((alternatives) => {
    const hits = alternatives.map((k) => hit(k)).filter((m): m is Match => m !== null)
    const sameEntry = hits.length > 0 && hits.every((m) => m.entry === hits[0].entry)
    return sameEntry ? hits[0] : { key: alternatives[0], verdict: 'not_recognised', entry: null }
  })

  // The main name and a single bracketed synonym name one thing: if either matched, the other needn't.
  const named = (i: number) => kinds[i] !== 'part'
  const nameMatched = matches.some((m, i) => named(i) && m.entry)
  const kept = matches.filter((m, i) => !(nameMatched && named(i) && !m.entry))

  return { input, verdict: mostSevere(kept.map((m) => m.verdict)), matches: kept }
}

export function analyse(ingredients: string[], index: RefIndex, hazards: Hazard[] = CANCER_ONLY): IngredientResult[] {
  return ingredients.map((i) => analyseIngredient(i, index, hazards))
}
