import { normalizeName } from '../../../src/ingredients/normalize'
import type { CatalogueRecord, Row } from '../types'
import { cell } from '../util'

/** Headers read from data/sources/e-numbers.csv (a file written from an official EU list: columns `E,Name`). */
export const COLUMNS = { e: 'E', name: 'Name' } as const

export function parseENumbers(rows: Row[]): CatalogueRecord[] {
  const out: CatalogueRecord[] = []
  for (const row of rows) {
    const name = cell(row, COLUMNS.name)
    const e = normalizeName(cell(row, COLUMNS.e)) // "E 171" -> "e171"
    if (!name || !e) continue
    out.push({ name, aliases: [e], cas: [], functionNote: '', euCosmeticsBanned: false })
  }
  return out
}
