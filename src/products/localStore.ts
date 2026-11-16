import { normalizeName } from '../ingredients/normalize'
import { withDb } from './db'
import { isLikelySame } from './matching'
import type { NewProduct, ProductRecord, ProductStore } from './types'

const MAX_TEXT = 120
const MAX_INGREDIENTS = 200
const MAX_INGREDIENT_LENGTH = 200

function newestFirst(a: ProductRecord, b: ProductRecord): number {
  return b.createdAt.localeCompare(a.createdAt)
}

function checkText(field: 'name' | 'brand', value: string): void {
  if (value.length < 1 || value.length > MAX_TEXT) {
    throw new Error(`${field} must be 1 to ${MAX_TEXT} characters`)
  }
}

export function createLocalStore(): ProductStore {
  return {
    async findMatches(p) {
      const all = await withDb((db) => db.getAll('products'))
      return all.filter((record) => isLikelySame(p, record)).sort(newestFirst)
    },

    async save(p: NewProduct) {
      const name = p.name.trim()
      const brand = p.brand.trim()
      checkText('name', name)
      checkText('brand', brand)
      if (p.type !== 'food' && p.type !== 'cosmetic') throw new Error('type must be food or cosmetic')
      if (p.ingredients.length < 1 || p.ingredients.length > MAX_INGREDIENTS) {
        throw new Error(`ingredients must have 1 to ${MAX_INGREDIENTS} items`)
      }
      if (p.ingredients.some((i) => i.length > MAX_INGREDIENT_LENGTH)) {
        throw new Error(`each ingredient must be at most ${MAX_INGREDIENT_LENGTH} characters`)
      }
      const record: ProductRecord = {
        ...p,
        name,
        brand,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      }
      await withDb((db) => db.put('products', record))
      return record
    },

    async setChecks(id, checks) {
      await withDb(async (db) => {
        const tx = db.transaction('products', 'readwrite')
        const record = await tx.store.get(id)
        if (record) await tx.store.put({ ...record, checks })
        await tx.done
      })
    },

    async delete(id) {
      await withDb(async (db) => {
        const tx = db.transaction(['products', 'scans'], 'readwrite')
        await Promise.all([tx.objectStore('products').delete(id), tx.objectStore('scans').delete(id), tx.done])
      })
    },

    async get(id) {
      return (await withDb((db) => db.get('products', id))) ?? null
    },

    async search(text) {
      const needle = normalizeName(text)
      if (!needle) return []
      const all = await withDb((db) => db.getAll('products'))
      return all
        .filter((r) => normalizeName(r.name).includes(needle) || normalizeName(r.brand).includes(needle))
        .sort(newestFirst)
    },
  }
}
