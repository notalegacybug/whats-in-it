import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { MyNote } from '../notes/myNotes'
import type { ProductRecord } from './types'

export interface ScanRow {
  productId: string
  scannedAt: string
}

interface IngredientSafetyDB extends DBSchema {
  products: { key: string; value: ProductRecord }
  scans: { key: string; value: ScanRow }
  myNotes: { key: string; value: MyNote }
}

const VERSION = 2

// Not cached on purpose, so a swapped-out `indexedDB` (as in tests) is always respected.
// Upgrades are additive steps from the phone's current version, so saved products are never touched.
export async function withDb<T>(fn: (db: IDBPDatabase<IngredientSafetyDB>) => Promise<T>): Promise<T> {
  const db = await openDB<IngredientSafetyDB>('ingredient-safety', VERSION, {
    upgrade(database, oldVersion) {
      if (oldVersion < 1) {
        database.createObjectStore('products', { keyPath: 'id' })
        database.createObjectStore('scans', { keyPath: 'productId' })
      }
      if (oldVersion < 2) database.createObjectStore('myNotes', { keyPath: 'key' })
    },
  })
  try {
    return await fn(db)
  } finally {
    db.close()
  }
}
