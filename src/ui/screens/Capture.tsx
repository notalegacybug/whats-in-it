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
    try {
      const read = readIngredients(await readImage(file, setProgress), index!)
      setIngredients(read.ingredients, read.fromDescription)
      setMayContain(read.mayContain)
    } catch {
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
