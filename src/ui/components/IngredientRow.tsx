interface Props {
  position: number // 1-based, used for the accessible label
  value: string
  suggestion: string | null
  onChange(value: string): void
  onRemove(): void
}

/** One editable ingredient with its remove button and, when the text looks misread, a correction. */
export function IngredientRow({ position, value, suggestion, onChange, onRemove }: Props) {
  return (
    <li className="row">
      <label>
        <span className="visually-hidden">Ingredient {position}</span>
        <input value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
      <button type="button" onClick={onRemove} aria-label={`Remove ${value || `ingredient ${position}`}`}>
        Remove
      </button>
      {suggestion && (
        <button type="button" className="suggestion" onClick={() => onChange(suggestion)}>
          Did you mean {suggestion}?
        </button>
      )}
    </li>
  )
}
