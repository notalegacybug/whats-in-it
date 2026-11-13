import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OCR_EMPTY_MESSAGE } from '../../copy'
import { extractIngredients } from '../../ingredients/split'
import { suggest } from '../../reference/suggest'
import { IngredientRow } from '../components/IngredientRow'
import { useReference } from '../ReferenceGate'
import { useScanDraft } from '../ScanDraft'

export function Review() {
  const { ingredients, setIngredients } = useScanDraft()
  const { index } = useReference()
  const navigate = useNavigate()
  const [pasted, setPasted] = useState('')
  // suggest() scans every reference key, so each text is scanned once: a keystroke in one row must not
  // rescan the others. A cache write during render is safe here because suggest() is pure.
  const suggestions = useMemo(() => new Map<string, string | null>(), [index])
  const suggestionFor = (text: string): string | null => {
    if (!index) return null
    if (!suggestions.has(text)) suggestions.set(text, suggest(text, index))
    return suggestions.get(text) ?? null
  }

  const edit = (i: number, value: string) => setIngredients(ingredients.map((v, j) => (j === i ? value : v)))

  function check() {
    // Blank rows (from "Add ingredient") carry nothing to check.
    setIngredients(ingredients.map((v) => v.trim()).filter(Boolean))
    navigate('/details')
  }

  return (
    <main>
      <h1>Check the ingredients</h1>
      {ingredients.length === 0 && <p>{OCR_EMPTY_MESSAGE}</p>}
      <ul className="rows">
        {ingredients.map((text, i) => (
          <IngredientRow
            key={i}
            position={i + 1}
            value={text}
            suggestion={suggestionFor(text)}
            onChange={(v) => edit(i, v)}
            onRemove={() => setIngredients(ingredients.filter((_, j) => j !== i))}
          />
        ))}
      </ul>
      <button type="button" onClick={() => setIngredients([...ingredients, ''])}>
        Add ingredient
      </button>

      <label className="field">
        Paste a list
        <textarea rows={4} value={pasted} onChange={(e) => setPasted(e.target.value)} />
      </label>
      <button
        type="button"
        disabled={!pasted.trim()}
        onClick={() => {
          setIngredients(extractIngredients(pasted))
          setPasted('')
        }}
      >
        Use this list
      </button>

      <button type="button" className="primary" disabled={ingredients.every((v) => !v.trim())} onClick={check}>
        Check ingredients
      </button>
    </main>
  )
}
