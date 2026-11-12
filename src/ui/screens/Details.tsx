import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import type { NewProduct, ProductRecord, ProductType } from '../../products/types'
import { addScan } from '../../scans/myScans'
import { useReference } from '../ReferenceGate'
import { useScanDraft } from '../ScanDraft'
import { useProductStore } from '../StoreContext'

export function Details() {
  const { ingredients, clear } = useScanDraft()
  const { index } = useReference()
  const store = useProductStore()
  const navigate = useNavigate()
  // Decided once on arrival: saving clears the draft, which must not bounce us home mid-navigation.
  const [arrivedEmpty] = useState(ingredients.length === 0)
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [type, setType] = useState<ProductType | null>(null)
  const [existing, setExisting] = useState<ProductRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  // The ref is the guard (two events in one tick both see stale state); state only disables the buttons.
  const inFlight = useRef(false)
  const [busy, setBusy] = useState(false)

  if (arrivedEmpty) return <Navigate to="/" replace />

  const product = (): NewProduct => ({
    name: name.trim(),
    brand: brand.trim(),
    type: type!,
    barcode: null,
    ingredients,
    referenceVersion: index!.version,
  })

  /** Runs one async step at a time. Stays locked on success (we navigate away); unlocks on failure or `release`. */
  async function guarded(step: () => Promise<'done' | 'release'>) {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError(null)
    let release = true
    try {
      release = (await step()) === 'release'
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong saving this product.')
    } finally {
      if (release) {
        inFlight.current = false
        setBusy(false)
      }
    }
  }

  async function persist(): Promise<'done'> {
    const saved = await store.save(product())
    await addScan(saved.id).catch(() => {}) // a missing history entry must not lose the save
    navigate(`/result/${saved.id}`)
    clear()
    return 'done'
  }

  const saveAsNew = () => guarded(persist)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    return guarded(async () => {
      const matches = await store.findMatches(product())
      if (matches.length > 0) {
        setExisting(matches[0])
        return 'release'
      }
      return persist()
    })
  }

  if (existing) {
    return (
      <main>
        <h1>Already saved?</h1>
        <p>
          Is this the same as {existing.brand} {existing.name}?
        </p>
        <button type="button" className="primary" disabled={busy} onClick={() => navigate(`/result/${existing.id}`)}>
          Yes, show saved result
        </button>
        <button type="button" disabled={busy} onClick={saveAsNew}>
          No, save as new
        </button>
        {error && <p role="alert">{error}</p>}
      </main>
    )
  }

  return (
    <main>
      <h1>About this product</h1>
      <form onSubmit={onSubmit}>
        <label className="field">
          Product name
          <input required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          Brand
          <input required value={brand} onChange={(e) => setBrand(e.target.value)} />
        </label>
        <fieldset>
          <legend>Type of product</legend>
          <label>
            <input type="radio" name="type" required checked={type === 'food'} onChange={() => setType('food')} />
            Food
          </label>
          <label>
            <input type="radio" name="type" required checked={type === 'cosmetic'} onChange={() => setType('cosmetic')} />
            Cosmetic
          </label>
        </fieldset>
        {error && <p role="alert">{error}</p>}
        <button type="submit" className="primary" disabled={busy}>
          Save and see result
        </button>
      </form>
    </main>
  )
}
