import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { openDB } from 'idb'
import { withDb } from '../products/db'
import { deleteNote, getNotes, saveNote } from './myNotes'

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})

test('a note is saved per ingredient, read back, replaced and deleted', async () => {
  await saveNote({ key: 'glicoamine', label: 'Glicoamine', tag: 'no_concern', note: 'Read the maker study.', link: 'https://example.org/study' })
  let notes = await getNotes()
  expect(notes.get('glicoamine')).toMatchObject({ label: 'Glicoamine', tag: 'no_concern', note: 'Read the maker study.', link: 'https://example.org/study' })
  await saveNote({ key: 'glicoamine', label: 'Glicoamine', tag: 'watch', note: 'Changed my mind.', link: '' })
  notes = await getNotes()
  expect(notes.get('glicoamine')).toMatchObject({ tag: 'watch', note: 'Changed my mind.' })
  await deleteNote('glicoamine')
  expect((await getNotes()).size).toBe(0)
})

test('only web links are kept, so a note cannot carry a script link', async () => {
  await expect(saveNote({ key: 'x', label: 'X', tag: 'none', note: '', link: 'javascript:alert(1)' })).rejects.toThrow(/http/)
})

test('an empty note with no tag and no link is not saved', async () => {
  await expect(saveNote({ key: 'x', label: 'X', tag: 'none', note: '  ', link: '' })).rejects.toThrow(/Add/)
})

test('upgrading a phone that already has saved products keeps them and adds the notes store', async () => {
  const old = await openDB('ingredient-safety', 1, {
    upgrade(db) {
      db.createObjectStore('products', { keyPath: 'id' })
      db.createObjectStore('scans', { keyPath: 'productId' })
    },
  })
  await old.put('products', { id: 'p1', name: 'Lotion' })
  old.close()
  const kept = await withDb((db) => db.get('products', 'p1'))
  expect(kept).toMatchObject({ name: 'Lotion' })
  await saveNote({ key: 'x', label: 'X', tag: 'watch', note: '', link: '' })
  expect((await getNotes()).has('x')).toBe(true)
})
