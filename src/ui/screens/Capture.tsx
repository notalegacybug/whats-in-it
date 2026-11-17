import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { readIngredients } from '../../reference/readIngredients'
import { readImage } from '../../ocr/readImage'
import { useReference } from '../ReferenceGate'
import { useScanDraft } from '../ScanDraft'

export function Capture() {
  const [params] = useSearchParams()
  const mode = params.get('mode')
  const navigate = useNavigate()
  const { setIngredients, setMayContain, clear } = useScanDraft()
  const { index } = useReference()
  const [progress, setProgress] = useState<number | null>(null)

  useEffect(() => {
    if (mode === 'text') {
      clear()
      navigate('/review', { replace: true })
    }
  }, [mode, clear, navigate])

  if (mode !== 'camera' && mode !== 'file' && mode !== 'text') return <Navigate to="/" replace />
  if (mode === 'text') return null

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setProgress(0)
    // TEMP DEBUG (remove after phone diagnosis): record what OCR did on this device.
    const t0 = performance.now()
    const device = `${navigator.userAgent} | mem ${(navigator as { deviceMemory?: number }).deviceMemory ?? '?'} GB | file ${file.type} ${(file.size / 1e6).toFixed(1)} MB`
    const debug = (s: string) => sessionStorage.setItem('ocr-debug', `${s}\n${((performance.now() - t0) / 1000).toFixed(1)} s | ${device}`)
    try {
      const text = await readImage(file, setProgress)
      debug(`OK, ${text.length} chars:\n${text.slice(0, 300)}`)
      const read = readIngredients(text, index!)
      setIngredients(read.ingredients, read.fromDescription)
      setMayContain(read.mayContain)
    } catch (e) {
      debug(`ERROR: ${e instanceof Error ? `${e.name}: ${e.message}` : JSON.stringify(e) ?? String(e)}`)
      // An unreadable image is not a dead end: Review explains it and lets the person type the list.
      setIngredients([], false)
    }
    navigate('/review')
  }

  if (progress !== null) {
    return (
      <main>
        <h1>Reading the label…</h1>
        <progress max={1} value={progress} aria-label="Reading progress" />
      </main>
    )
  }

  const label = mode === 'camera' ? 'Take a photo of the label' : 'Choose an image of the label'
  return (
    <main>
      <h1>{mode === 'camera' ? 'Take a photo' : 'Choose an image'}</h1>
      <label className="field">
        {label}
        <input
          type="file"
          accept="image/*"
          capture={mode === 'camera' ? 'environment' : undefined}
          onChange={onPick}
        />
      </label>
    </main>
  )
}
