import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProductRecord } from '../../products/types'
import { useProductStore } from '../StoreContext'

export function Search() {
  const store = useProductStore()
  const [text, setText] = useState('')
  const [results, setResults] = useState<ProductRecord[]>([])
  const query = text.trim()

  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }
    // `live` drops a slow earlier search that resolves after a newer one.
    let live = true
    void store.search(query).then((r) => {
      if (live) setResults(r)
    })
    return () => {
      live = false
    }
  }, [store, query])

  return (
    <main>
      <p><Link to="/">Home</Link></p>
      <h1>Search</h1>
      <label className="field">
        Search saved products
        <input type="search" value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      {query && results.length === 0 ? <p>No saved products match.</p> : null}
      {results.length > 0 && query ? (
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
