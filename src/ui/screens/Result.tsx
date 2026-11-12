import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DISCLAIMER, VERDICT_LABEL } from '../../copy'
import type { ProductRecord } from '../../products/types'
import { analyse, SEVERITY } from '../../reference/analyse'
import { addScan } from '../../scans/myScans'
import { ResultItem } from '../components/ResultItem'
import { useReference } from '../ReferenceGate'
import { useProductStore } from '../StoreContext'

export function Result() {
  const { id } = useParams()
  const store = useProductStore()
  const { index } = useReference()
  // `undefined` while loading, `null` when the id is unknown.
  const [record, setRecord] = useState<ProductRecord | null | undefined>(undefined)

  useEffect(() => {
    let live = true
    setRecord(undefined)
    store.get(id ?? '').then(
      (r) => {
        if (!live) return
        setRecord(r)
        // Recording history is best-effort. StrictMode runs this twice in dev; the upsert is idempotent.
        if (r) addScan(r.id).catch(() => {})
      },
      () => live && setRecord(null),
    )
    return () => {
      live = false
    }
  }, [store, id])

  const results = useMemo(() => (record && index ? analyse(record.ingredients, index) : []), [record, index])

  if (record === undefined) return <p role="status">Loading…</p>
  if (record === null) {
    return (
      <main>
        <p>We couldn't find that product.</p>
        <Link to="/">Back to start</Link>
      </main>
    )
  }

  return (
    <main>
      <h1>
        {record.brand} {record.name}
      </h1>
      {SEVERITY.map((verdict) => {
        const items = results.filter((r) => r.verdict === verdict)
        if (items.length === 0) return null
        return (
          <section key={verdict} className={`verdict ${verdict}`}>
            <h2>
              {VERDICT_LABEL[verdict]} ({items.length})
            </h2>
            <ul>
              {items.map((r, i) => (
                <ResultItem key={i} result={r} />
              ))}
            </ul>
          </section>
        )
      })}
      <p className="disclaimer">{DISCLAIMER}</p>
      <Link to="/">Check another label</Link>
    </main>
  )
}
