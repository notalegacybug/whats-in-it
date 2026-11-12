import { Link } from 'react-router-dom'
import { DISCLAIMER, SOURCES_ABOUT } from '../../copy'
import { useReference } from '../ReferenceGate'

export function About() {
  const { index } = useReference()
  return (
    <main>
      <p><Link to="/">Home</Link></p>
      <h1>About</h1>
      <p>{DISCLAIMER}</p>
      <h2>Sources</h2>
      <ul>
        {SOURCES_ABOUT.map((s) => (
          <li key={s.id}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a>
          </li>
        ))}
      </ul>
      {index ? <p>Reference version {index.version}</p> : null}
      <p>
        An ingredient that is not on these lists is shown as "No known concern on these lists". That is not a
        statement that it has been tested or proven harmless.
      </p>
    </main>
  )
}
