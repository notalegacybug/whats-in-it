import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  CHECK_HORMONE,
  checkedAgainst,
  DISCLAIMER,
  EXTRA_HAZARDS,
  HIDE_HORMONE,
  HORMONE_ON,
  PARTIAL_CHECK,
  resultSummary,
  sourcesFor,
  VERDICT_LABEL,
} from '../../copy'
import { deleteNote, getNotes, saveNote, type MyNote } from '../../notes/myNotes'
import type { ProductRecord } from '../../products/types'
import { allergensOf } from '../../reference/allergens'
import { analyse, CANCER_ONLY, SEVERITY } from '../../reference/analyse'
import type { Hazard } from '../../reference/types'
import { addScan } from '../../scans/myScans'
import type { ResearchActions } from '../components/MyResearch'
import { MayContain } from '../components/MayContain'
import { ResultItem } from '../components/ResultItem'
import { useReference } from '../ReferenceGate'
import { useScanDraft } from '../ScanDraft'
import { useProductStore } from '../StoreContext'

export function Result() {
  const { id } = useParams()
  const store = useProductStore()
  const { index } = useReference()
  const { load } = useScanDraft()
  const navigate = useNavigate()
  // `undefined` while loading, `null` when the id is unknown.
  const [record, setRecord] = useState<ProductRecord | null | undefined>(undefined)
  const [notes, setNotes] = useState<Map<string, MyNote>>(new Map())

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

  // The person's research is optional extra: if it cannot be read, results still show.
  const refreshNotes = useCallback(() => getNotes().then(setNotes, () => {}), [])
  useEffect(() => {
    void refreshNotes()
  }, [refreshNotes])

  const research: ResearchActions = useMemo(
    () => ({
      notes,
      save: async (n) => {
        await saveNote(n)
        await refreshNotes()
      },
      remove: async (key) => {
        await deleteNote(key)
        await refreshNotes()
      },
    }),
    [notes, refreshNotes],
  )

  // Cancer is always checked; the hormone check is on when the person turned it on for this product.
  // Saved as 'hormone' (the first extra check) so products saved before reproductive lists existed still open with it on.
  const hormoneAvailable = !!index?.sources.some((s) => s === 'ED_LISTS' || s === 'PROP65')
  const hormoneOn = hormoneAvailable && !!record?.checks?.includes('hormone')
  const hazards: Hazard[] = useMemo(() => (hormoneOn ? ['cancer', ...EXTRA_HAZARDS] : CANCER_ONLY), [hormoneOn])
  const results = useMemo(() => (record && index ? analyse(record.ingredients, index, hazards) : []), [record, index, hazards])

  const unchecked = results.filter((r) => r.verdict === 'not_recognised')
  const researched = unchecked.filter((r) => r.matches.some((m) => !m.entry && notes.has(m.key))).length
  const withAllergens = results.filter((r) => allergensOf(r).length > 0).length
  const sources = sourcesFor(index?.sources ?? [], hazards)
  const checked = checkedAgainst(sources)
  const summary =
    resultSummary(
      {
        flagged: results.filter((r) => r.verdict === 'watch_strong' || r.verdict === 'watch_possible').length,
        unchecked: unchecked.length,
        total: results.length,
      },
      sources,
      hormoneOn,
    ) +
    (withAllergens ? ` ${withAllergens} contain${withAllergens === 1 ? 's' : ''} a known allergen.` : '') +
    (researched ? ` You added your own research for ${researched}.` : '')

  if (record === undefined) return <p role="status">Loading…</p>
  if (record === null) {
    return (
      <main>
        <p>We couldn't find that product.</p>
        <Link to="/">Back to start</Link>
      </main>
    )
  }

  // Saved on the product, so it opens the same way next time and shows in My scans.
  async function setHormone(on: boolean) {
    if (!record) return
    const checks: Hazard[] = on ? ['hormone'] : []
    setRecord({ ...record, checks })
    await store.setChecks(record.id, checks).catch(() => {})
  }

  // Fixing a misread name starts a new version of this product; the saved one is kept.
  function editIngredients() {
    if (!record) return
    load(record.ingredients, !!record.fromDescription, { name: record.name, brand: record.brand, type: record.type }, record.mayContain)
    navigate('/review')
  }

  return (
    <main>
      <h1>
        {record.brand} {record.name}
      </h1>
      {record.fromDescription && (
        <p role="note" className="notice">
          {PARTIAL_CHECK}
        </p>
      )}
      {hormoneOn && (
        <p role="note" className="check-on">
          {HORMONE_ON}
        </p>
      )}
      {results.length > 0 && (
        <p className="summary" data-testid="result-summary">
          {summary}
        </p>
      )}
      <MayContain groups={record.mayContain ?? []} />
      {SEVERITY.map((verdict) => {
        const items = results.filter((r) => r.verdict === verdict)
        if (items.length === 0) return null
        return (
          <section key={verdict} className={`verdict ${verdict}`}>
            <h2>
              {VERDICT_LABEL[verdict]} ({items.length})
            </h2>
            {verdict === 'no_known_concern' && <p className="checked-against">{checked}</p>}
            <ul>
              {items.map((r, i) => (
                <ResultItem key={i} result={r} research={research} hazards={hazards} />
              ))}
            </ul>
          </section>
        )
      })}
      <p className="checked-against">{checked}</p>
      <p className="disclaimer">{DISCLAIMER}</p>
      <p>
        {hormoneAvailable && (
          <button type="button" className={hormoneOn ? undefined : 'primary'} onClick={() => void setHormone(!hormoneOn)}>
            {hormoneOn ? HIDE_HORMONE : CHECK_HORMONE}
          </button>
        )}
        <button type="button" onClick={editIngredients}>
          Edit ingredients
        </button>
      </p>
      <Link to="/">Check another label</Link>
    </main>
  )
}
