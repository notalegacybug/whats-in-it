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

  useEffect(() => {
    let live = true
    void (async () => {
      const scans = await listScans()
      const found = await Promise.all(
        scans.map(async (s) => ({ product: await store.get(s.productId), scannedAt: s.scannedAt })),
      )
      // A scan whose product has been removed is skipped rather than shown as a dead link.
      const present = found.flatMap((f) => (f.product ? [{ product: f.product, scannedAt: f.scannedAt }] : []))
      if (live) setRows(present)
    })()
    return () => {
      live = false
    }
  }, [store])

  return (
    <main>
      <p><Link to="/">Home</Link></p>
      <h1>My scans</h1>
      {rows === null ? null : rows.length === 0 ? (
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
