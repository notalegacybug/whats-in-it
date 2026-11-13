import { SOURCE_LABEL } from '../../copy'
import type { IngredientResult, Listing, Match } from '../../reference/types'

function ListingLine({ listing }: { listing: Listing }) {
  // Every citation names its source and, where the list gives one, its year; otherwise the edition.
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

function WatchMatch({ input, match }: { input: string; match: Match }) {
  const entry = match.entry!
  return (
    <div className="match">
      {entry.name.toLowerCase() !== input.trim().toLowerCase() && <p>Matched as {entry.name}</p>}
      {entry.note && <p>{entry.note}</p>}
      {entry.caveat && <p>{entry.caveat}</p>}
      <ul>
        {entry.listings.map((l, i) => (
          <ListingLine key={i} listing={l} />
        ))}
      </ul>
      {entry.euCosmeticsBanned && <p>Also banned in EU cosmetics</p>}
    </div>
  )
}

/** One analysed ingredient: its label text, then whatever the reference says about it. */
export function ResultItem({ result }: { result: IngredientResult }) {
  const watching = result.matches.filter((m) => m.verdict === 'watch_strong' || m.verdict === 'watch_possible')
  const first = result.matches[0]?.entry
  // When some parts were recognised, name only the ones that were not, so the person knows what to look at.
  const someRecognised = result.matches.some((m) => m.entry !== null)
  const unchecked = result.matches.filter((m) => m.verdict === 'not_recognised').map((m) => m.key)

  return (
    <li className="item">
      <strong>{result.input}</strong>
      {result.verdict === 'not_recognised' && (
        <p>{someRecognised && unchecked.length ? `We couldn't check: ${unchecked.join(', ')}` : "We couldn't check this one."}</p>
      )}
      {result.verdict === 'no_known_concern' && (first?.note ?? first?.functionNote) && (
        <p>{first?.note ?? first?.functionNote}</p>
      )}
      {watching.map((m) => (
        <WatchMatch key={m.key} input={result.input} match={m} />
      ))}
    </li>
  )
}
