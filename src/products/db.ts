import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { ProductRecord } from './types'

export interface ScanRow {
  productId: string
  scannedAt: string
}

interface IngredientSafetyDB extends DBSchema {
  products: { key: string; value: ProductRecord }
  scans: { key: string; value: ScanRow }
}

// Not cached on purpose, so a swapped-out `indexedDB` (as in tests) is always respected.
export async function withDb<T>(fn: (db: IDBPDatabase<IngredientSafetyDB>) => Promise<T>): Promise<T> {
  const db = await openDB<IngredientSafetyDB>('ingredient-safety', 1, {
    upgrade(database) {
      database.createObjectStore('products', { keyPath: 'id' })
      database.createObjectStore('scans', { keyPath: 'productId' })
    },
  })
  try {
    return await fn(db)
  } finally {
    db.close()
  }
}
