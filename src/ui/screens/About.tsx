import { Link } from 'react-router-dom'
import { CHECK_HORMONE, DISCLAIMER, HORMONE_SOURCES_ABOUT, NOT_YET_INCLUDED, SOURCES_ABOUT } from '../../copy'
import { useReference } from '../ReferenceGate'

type SourceAbout = (typeof SOURCES_ABOUT)[number]

function SourceLinks({ sources }: { sources: SourceAbout[] }) {
  return (
    <ul>
      {sources.map((s) => (
        <li key={s.id}>
          <a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a>
        </li>
      ))}
    </ul>
  )
}

export function About() {
  const { index } = useReference()
  const included = index?.sources ?? []
  const checked = SOURCES_ABOUT.filter((s) => included.includes(s.id))
  const notYet = SOURCES_ABOUT.filter((s) => !included.includes(s.id))
  const hormone = HORMONE_SOURCES_ABOUT.filter((s) => included.includes(s.id))
  return (
    <main>
      <p><Link to="/">Home</Link></p>
      <h1>About</h1>
      <p>{DISCLAIMER}</p>
      <section aria-labelledby="checked-against">
        <h2 id="checked-against">Checked against</h2>
        {checked.length ? <SourceLinks sources={checked} /> : <p>No hazard lists yet.</p>}
      </section>
      {notYet.length > 0 && (
        <section aria-labelledby="not-yet-included">
          <h2 id="not-yet-included">Not yet included</h2>
          <p>{NOT_YET_INCLUDED}</p>
          <SourceLinks sources={notYet} />
        </section>
      )}
      {hormone.length > 0 && (
        <section aria-labelledby="hormone-check">
          <h2 id="hormone-check">Hormone &amp; reproductive check (optional)</h2>
          <p>
            Turn it on from a result with "{CHECK_HORMONE}". Hormone disruptors come from the EU lists below (only
            substances listed for effects on human health; "under evaluation" means a review is in progress, not a
            finding). Reproductive harm comes from the California Proposition 65 list.
          </p>
          <SourceLinks sources={hormone} />
        </section>
      )}
      <section aria-labelledby="allergens">
        <h2 id="allergens">Allergen tags</h2>
        <p>
          Always on, for information. They do not change whether an ingredient is listed under "Watch for".
        </p>
        <ul>
          <li>
            Fragrance allergens: the substances EU law requires cosmetics to name on the label (
            <a href="https://ec.europa.eu/growth/tools-databases/cosing/" target="_blank" rel="noopener noreferrer">
              EU CosIng, Annex III
            </a>
            ).
          </li>
          <li>
            Food allergens: the 14 groups EU law requires food labels to highlight (
            <a href="https://eur-lex.europa.eu/eli/reg/2011/1169/oj" target="_blank" rel="noopener noreferrer">
              Regulation (EU) No 1169/2011, Annex II
            </a>
            ), matched by ingredient name.
          </li>
        </ul>
      </section>
      {index ? <p>Reference version {index.version}</p> : null}
      <p>
        <a href="/privacy.html">Privacy policy</a>: no accounts, no tracking; your scans stay on this phone.
      </p>
      <p>
        An ingredient that is not on these lists is shown as "No known concern on these lists". That is not a
        statement that it has been tested or proven harmless.
      </p>
    </main>
  )
}
