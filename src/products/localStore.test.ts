import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { createLocalStore } from './localStore'
import type { NewProduct } from './types'

const product: NewProduct = {
  name: 'Moisturiser',
  brand: 'Dove',
  type: 'cosmetic',
  barcode: null,
  ingredients: ['aqua', 'glycerin'],
  referenceVersion: 'v1',
}

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('local product store', () => {
  it('round-trips a saved product and sets id and createdAt', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-01-02T03:04:05.000Z'))
    const store = createLocalStore()
    const saved = await store.save(product)
    expect(saved.id).toBeTruthy()
    expect(saved.createdAt).toBe('2026-01-02T03:04:05.000Z')
    expect(await store.get(saved.id)).toEqual({ ...product, ...saved })
  })

  it('returns null for an unknown id', async () => {
    expect(await createLocalStore().get('nope')).toBeNull()
  })

  it('trims name and brand when saving', async () => {
    const saved = await createLocalStore().save({ ...product, name: '  Soap ', brand: ' Dove  ' })
    expect(saved.name).toBe('Soap')
    expect(saved.brand).toBe('Dove')
  })

  it('findMatches returns the earlier record for a likely-same product', async () => {
    const store = createLocalStore()
    const saved = await store.save(product)
    const matches = await store.findMatches({ ...product, name: 'MOISTURISER' })
    expect(matches.map((m) => m.id)).toEqual([saved.id])
  })

  it('findMatches returns [] when nothing is likely the same', async () => {
    const store = createLocalStore()
    await store.save(product)
    expect(await store.findMatches({ ...product, brand: 'Nivea' })).toEqual([])
  })

  it('search finds by brand or name, case-insensitively, newest first', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const store = createLocalStore()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    const older = await store.save(product)
    vi.setSystemTime(new Date('2026-01-02T00:00:00.000Z'))
    const newer = await store.save({ ...product, name: 'Body wash', brand: 'Dovetail' })
    await store.save({ ...product, name: 'Shampoo', brand: 'Nivea' })
    const found = await store.search('dov')
    expect(found.map((p) => p.id)).toEqual([newer.id, older.id])
    expect((await store.search('SHAMP')).length).toBe(1)
  })

  it('search of empty or whitespace text returns []', async () => {
    const store = createLocalStore()
    await store.save(product)
    expect(await store.search('')).toEqual([])
    expect(await store.search('   ')).toEqual([])
  })

  it('rejects an empty name', async () => {
    await expect(createLocalStore().save({ ...product, name: '   ' })).rejects.toThrow(/name/)
  })

  it('rejects an empty or over-long brand', async () => {
    const store = createLocalStore()
    await expect(store.save({ ...product, brand: '' })).rejects.toThrow(/brand/)
    await expect(store.save({ ...product, brand: 'x'.repeat(121) })).rejects.toThrow(/brand/)
  })

  it('rejects 201 ingredients and zero ingredients', async () => {
    const store = createLocalStore()
    const many = Array.from({ length: 201 }, (_, i) => `i${i}`)
    await expect(store.save({ ...product, ingredients: many })).rejects.toThrow(/ingredients/)
    await expect(store.save({ ...product, ingredients: [] })).rejects.toThrow(/ingredients/)
  })

  it('rejects a 201-character ingredient', async () => {
    await expect(
      createLocalStore().save({ ...product, ingredients: ['x'.repeat(201)] }),
    ).rejects.toThrow(/ingredient/)
  })
})
