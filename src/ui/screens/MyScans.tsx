import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProductRecord } from '../../products/types'
import { listScans } from '../../scans/myScans'
import { useProductStore } from '../StoreContext'

interface Row {
  product: ProductRecord
  scannedAt: string
}

export function MyScans() {
  const store = useProductStore()
  const [rows, setRows] = useState<Row[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let live = true
    void (async () => {
      try {
        const scans = await listScans()
        const found = await Promise.all(
          scans.map(async (s) => ({
            // One unreadable product skips that row; it must not fail the whole list.
            product: await store.get(s.productId).catch(() => null),
            scannedAt: s.scannedAt,
          })),
        )
        // A scan whose product has been removed is skipped rather than shown as a dead link.
        const present = found.flatMap((f) => (f.product ? [{ product: f.product, scannedAt: f.scannedAt }] : []))
        if (live) setRows(present)
      } catch {
        if (live) setFailed(true)
      }
    })()
    return () => {
      live = false
    }
  }, [store])

  return (
    <main>
      <p><Link to="/">Home</Link></p>
      <h1>My scans</h1>
      {failed ? (
        <p role="alert">Couldn't load your saved scans.</p>
      ) : rows === null ? (
        <p role="status">Loading…</p>
      ) : rows.length === 0 ? (
        <p>Nothing scanned yet.</p>
      ) : (
        <ul>
          {rows.map(({ product, scannedAt }) => (
            <li key={product.id}>
              <Link to={`/result/${product.id}`}>{`${product.brand} ${product.name}`}</Link>{' '}
              <span>{new Date(scannedAt).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
