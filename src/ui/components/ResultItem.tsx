import { HAZARD_CHIP, MY_TAG_LABEL, SOURCE_LABEL, USED_AS, VERDICT_TAG } from '../../copy'
import { CANCER_ONLY, listingsFor } from '../../reference/analyse'
import { MyResearch, type ResearchActions } from './MyResearch'
import type { Hazard, IngredientResult, Listing, Match } from '../../reference/types'

function ListingLine({ listing }: { listing: Listing }) {
  const text = [SOURCE_LABEL[listing.source], listing.classification, listing.year ?? listing.edition]
    .filter((part) => part !== null && part !== undefined)
    .join(' · ')
  return (
    <li>
      <a href={listing.url} target="_blank" rel="noopener noreferrer">
        {text}
      </a>
      {listing.qualifier && <span> {listing.qualifier}</span>}
    </li>
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
      <ul>
        {listingsFor(entry, hazards).map((l, i) => (
          <ListingLine key={i} listing={l} />
        ))}
      </ul>
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
