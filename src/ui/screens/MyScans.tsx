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
  const [confirming, setConfirming] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(false)

  async function remove(id: string) {
    setDeleting(true)
    setDeleteError(false)
    try {
      await store.delete(id)
      setRows((current) => current?.filter((r) => r.product.id !== id) ?? null)
      setConfirming(null)
    } catch {
      setDeleteError(true)
    } finally {
      setDeleting(false)
    }
  }

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
      {deleteError && <p role="alert">Couldn't delete that product. Try again.</p>}
      {failed ? (
        <p role="alert">Couldn't load your saved scans.</p>
      ) : rows === null ? (
        <p role="status">Loading…</p>
      ) : rows.length === 0 ? (
        <p>Nothing scanned yet.</p>
      ) : (
        <ul className="scans">
          {rows.map(({ product, scannedAt }) => {
            const title = `${product.brand} ${product.name}`
            return (
              <li key={product.id}>
                <Link to={`/result/${product.id}`}>{title}</Link>{' '}
                <span>{new Date(scannedAt).toLocaleDateString()}</span>{' '}
                <span className="tag">{product.checks?.includes('hormone') ? 'Cancer + hormone & reproductive check' : 'Cancer check'}</span>{' '}
                <button type="button" className="link-button" aria-label={`Delete ${title}`} onClick={() => setConfirming(product.id)}>
                  Delete
                </button>
                {confirming === product.id && (
                  <div role="alertdialog" aria-label={`Delete ${title}`} className="notice">
                    <p>{`Delete ${title}? It is removed from this phone and can't be undone.`}</p>
                    <button type="button" disabled={deleting} onClick={() => void remove(product.id)}>
                      Yes, delete
                    </button>{' '}
                    <button type="button" onClick={() => setConfirming(null)}>
                      Cancel
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
