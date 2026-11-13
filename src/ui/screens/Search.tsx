import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProductRecord } from '../../products/types'
import { useProductStore } from '../StoreContext'

export function Search() {
  const store = useProductStore()
  const [text, setText] = useState('')
  const [found, setFound] = useState<{ query: string; results: ProductRecord[] } | null>(null)
  const [failed, setFailed] = useState(false)
  const query = text.trim()

  useEffect(() => {
    setFailed(false)
    if (!query) return
    // `live` drops a slow earlier search that resolves after a newer one.
    let live = true
    store.search(query).then(
      (results) => {
        if (live) setFound({ query, results })
      },
      () => {
        if (live) setFailed(true)
      },
    )
    return () => {
      live = false
    }
  }, [store, query])

  // Results only count if they were fetched for the query now showing; otherwise we are still waiting.
  const results = query && found?.query === query ? found.results : null

  return (
    <main>
      <p><Link to="/">Home</Link></p>
      <h1>Search</h1>
      <label className="field">
        Search saved products
        <input type="search" value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      {failed ? <p role="alert">Couldn't search saved products.</p> : null}
      {!failed && results && results.length === 0 ? <p>No saved products match.</p> : null}
      {!failed && results && results.length > 0 ? (
        <ul>
          {results.map((p) => (
            <li key={p.id}>
              <Link to={`/result/${p.id}`}>{`${p.brand} ${p.name}`}</Link>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  )
}
