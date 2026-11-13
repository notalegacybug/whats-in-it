import { Link } from 'react-router-dom'
import { DISCLAIMER, NOT_YET_INCLUDED, SOURCES_ABOUT } from '../../copy'
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
      {index ? <p>Reference version {index.version}</p> : null}
      <p>
        An ingredient that is not on these lists is shown as "No known concern on these lists". That is not a
        statement that it has been tested or proven harmless.
      </p>
    </main>
  )
}
