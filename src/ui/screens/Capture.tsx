import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { extractIngredients } from '../../ingredients/split'
import { readImage } from '../../ocr/readImage'
import { useScanDraft } from '../ScanDraft'

export function Capture() {
  const [params] = useSearchParams()
  const mode = params.get('mode')
  const navigate = useNavigate()
  const { setIngredients, clear } = useScanDraft()
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
      setIngredients(extractIngredients(await readImage(file, setProgress)))
    } catch {
      // An unreadable image is not a dead end: Review explains it and lets the person type the list.
      setIngredients([])
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
