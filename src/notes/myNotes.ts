import { withDb } from '../products/db'

// The person's own research on an ingredient the app could not check. Kept on this device only, and always
// shown as set by them: it never changes the app's own verdict.
export type MyTag = 'none' | 'no_concern' | 'watch'

export interface MyNote {
  /** Normalised ingredient name, so the note follows the ingredient across products. */
  key: string
  label: string
  tag: MyTag
  note: string
  link: string
  updatedAt: string
}

const MAX_NOTE = 1000
const MAX_LINK = 500

export async function getNotes(): Promise<Map<string, MyNote>> {
  const rows = await withDb((db) => db.getAll('myNotes'))
  return new Map(rows.map((n) => [n.key, n]))
}

export async function saveNote(input: Omit<MyNote, 'updatedAt'>): Promise<MyNote> {
  const note = input.note.trim().slice(0, MAX_NOTE)
  const link = input.link.trim().slice(0, MAX_LINK)
  // Only web links: a "javascript:" link would run code when tapped.
  if (link && !/^https?:\/\//i.test(link)) throw new Error('The link must start with http:// or https://')
  if (input.tag === 'none' && !note && !link) throw new Error('Add a tag, a note or a link')
  const row: MyNote = { ...input, note, link, updatedAt: new Date().toISOString() }
  await withDb((db) => db.put('myNotes', row))
  return row
}

export async function deleteNote(key: string): Promise<void> {
  await withDb((db) => db.delete('myNotes', key))
}
