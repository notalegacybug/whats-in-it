import { normalizeName } from '../../../src/ingredients/normalize'
import type { CatalogueRecord, Row } from '../types'
import { cell } from '../util'

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
