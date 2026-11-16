import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { MY_TAG_LABEL, YOUR_RESEARCH_CAVEAT } from '../../copy'
import type { MyNote, MyTag } from '../../notes/myNotes'

export interface ResearchActions {
  notes: Map<string, MyNote>
  save(note: Omit<MyNote, 'updatedAt'>): Promise<void>
  remove(key: string): Promise<void>
}

// One unchecked ingredient: the person's own research, or a button to add it.
export function MyResearch({ ingredientKey, label, actions }: { ingredientKey: string; label: string; actions: ResearchActions }) {
  const existing = actions.notes.get(ingredientKey)
  const [editing, setEditing] = useState(false)
  const [tag, setTag] = useState<MyTag>(existing?.tag ?? 'none')
  const [note, setNote] = useState(existing?.note ?? '')
  const [link, setLink] = useState(existing?.link ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const id = useId()
  const title = `Your research for ${label}`

  function startEditing() {
    setTag(existing?.tag ?? 'none')
    setNote(existing?.note ?? '')
    setLink(existing?.link ?? '')
    setError(null)
    setEditing(true)
  }

  async function onSave(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await actions.save({ key: ingredientKey, label, tag, note, link })
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your research.")
    } finally {
      setBusy(false)
    }
  }

  if (editing) {
    return (
      <form className="research" aria-label={title} onSubmit={onSave}>
        <label htmlFor={`${id}-tag`}>Your tag</label>
        <select id={`${id}-tag`} value={tag} onChange={(e) => setTag(e.target.value as MyTag)}>
          <option value="none">No tag</option>
          <option value="no_concern">{MY_TAG_LABEL.no_concern}</option>
          <option value="watch">{MY_TAG_LABEL.watch}</option>
        </select>
        <label htmlFor={`${id}-note`}>Your note</label>
        <textarea id={`${id}-note`} rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
        <label htmlFor={`${id}-link`}>Link (optional)</label>
        <input id={`${id}-link`} type="url" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} />
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={busy}>
          Save research
        </button>{' '}
        <button type="button" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </form>
    )
  }

  if (!existing) {
    return (
      <button type="button" className="link-button add-research" onClick={startEditing}>
        {`Add your research for ${label}`}
      </button>
    )
  }

  return (
    <section className="research" aria-label={title}>
      <p>
        <strong>{title}</strong>
        {existing.tag !== 'none' && (
          <>
            {' '}
            <span className={`tag mine ${existing.tag}`}>{MY_TAG_LABEL[existing.tag]}</span>
          </>
        )}
      </p>
      <p className="caveat">{YOUR_RESEARCH_CAVEAT}</p>
      {existing.note && <p>{existing.note}</p>}
      {existing.link && (
        <p>
          <a href={existing.link} target="_blank" rel="noopener noreferrer">
            {existing.link}
          </a>
        </p>
      )}
      <button type="button" className="link-button" onClick={startEditing}>
        Edit
      </button>{' '}
      <button type="button" className="link-button" onClick={() => void actions.remove(ingredientKey)}>
        Delete
      </button>
    </section>
  )
}
