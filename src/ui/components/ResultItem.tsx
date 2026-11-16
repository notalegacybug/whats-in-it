import { HAZARD_CHIP, MY_TAG_LABEL, SOURCE_LABEL, USED_AS, VERDICT_TAG } from '../../copy'
import { allergensOf } from '../../reference/allergens'
import { CANCER_ONLY, listingsFor } from '../../reference/analyse'
import { MyResearch, type ResearchActions } from './MyResearch'
import type { Hazard, IngredientResult, Listing, Match } from '../../reference/types'

// One small line per flagged ingredient: "Source: NTP 2021 · IARC 2012 (inhalation)". The verdict tag already
// says how strong the listing is, so the full wording is kept for screen readers rather than shown.
function SourceLine({ listings }: { listings: Listing[] }) {
  return (
    <p className="sources" data-testid="sources">
      Source:{' '}
      {listings.map((l, i) => {
        const year = l.year ?? l.edition?.match(/\b(?:19|20)\d{2}\b/)?.[0] ?? null
        const full = [SOURCE_LABEL[l.source], l.classification, l.year ?? l.edition].filter((p) => p !== null && p !== undefined).join(' · ')
        return (
          <span key={i}>
            {i > 0 && ' · '}
            <a href={l.url} target="_blank" rel="noopener noreferrer" aria-label={full} title={l.classification}>
              {[SOURCE_LABEL[l.source], year].filter(Boolean).join(' ')}
            </a>
            {l.qualifier && ` (${l.qualifier})`}
          </span>
        )
      })}
    </p>
  )
}

function WatchMatch({ input, match, hazards }: { input: string; match: Match; hazards: Hazard[] }) {
  const entry = match.entry!
  return (
    <div className="match">
      {entry.name.toLowerCase() !== input.trim().toLowerCase() && <p>Matched as {entry.name}</p>}
      {entry.note && <p>{entry.note}</p>}
      {!entry.note && entry.functionNote && (
        <p>
          {USED_AS}
          {entry.functionNote}
        </p>
      )}
      {entry.caveat && <p>{entry.caveat}</p>}
      <SourceLine listings={listingsFor(entry, hazards)} />
      {entry.euCosmeticsBanned && <p>Also banned in EU cosmetics</p>}
    </div>
  )
}

export function ResultItem({
  result,
  research,
  hazards = CANCER_ONLY,
}: {
  result: IngredientResult
  research?: ResearchActions
  hazards?: Hazard[]
}) {
  const watching = result.matches.filter((m) => m.verdict === 'watch_strong' || m.verdict === 'watch_possible')
  const first = result.matches[0]?.entry
  // When some parts were recognised, name only the ones that were not, so the person knows what to look at.
  const someRecognised = result.matches.some((m) => m.entry !== null)
  const unchecked = result.matches.filter((m) => m.verdict === 'not_recognised').map((m) => m.key)
  // A wholly unrecognised item is named as written; a part of a partly recognised one by its key.
  const labelFor = (key: string) => (!someRecognised && unchecked.length === 1 ? result.input : key)
  const yourTags = [...new Set(unchecked.map((k) => research?.notes.get(k)?.tag).filter((t) => t === 'no_concern' || t === 'watch'))]

  return (
    <li className="item">
      <strong>{result.input}</strong>{' '}
      <span className={`tag ${result.verdict}`} data-testid="verdict-tag">
        {VERDICT_TAG[result.verdict]}
      </span>
      {/* With more than one check on, say which kind of list each flagged ingredient is on. */}
      {hazards.length > 1 &&
        [...new Set(watching.flatMap((m) => listingsFor(m.entry!, hazards).map((l) => l.hazard ?? 'cancer')))].map((h) => (
          <span key={h}>
            {' '}
            <span className={`tag hazard ${h}`}>{HAZARD_CHIP[h]}</span>
          </span>
        ))}
      {allergensOf(result).map((a) => (
        <span key={a}>
          {' '}
          <span className="tag allergen" data-testid="allergen-tag">{`Allergen: ${a}`}</span>
        </span>
      ))}
      {yourTags.map((t) => (
        <span key={t}>
          {' '}
          <span className={`tag mine ${t}`}>{MY_TAG_LABEL[t]}</span>
        </span>
      ))}
      {result.verdict === 'not_recognised' && (
        <p>{someRecognised && unchecked.length ? `We couldn't check: ${unchecked.join(', ')}` : "We couldn't check this one."}</p>
      )}
      {result.verdict === 'not_recognised' &&
        research &&
        unchecked.map((k) => <MyResearch key={k} ingredientKey={k} label={labelFor(k)} actions={research} />)}
      {result.verdict === 'no_known_concern' && first?.note && <p>{first.note}</p>}
      {result.verdict === 'no_known_concern' && !first?.note && first?.functionNote && (
        <p>
          {USED_AS}
          {first.functionNote}
        </p>
      )}
      {watching.map((m) => (
        <WatchMatch key={m.key} input={result.input} match={m} hazards={hazards} />
      ))}
    </li>
  )
}
