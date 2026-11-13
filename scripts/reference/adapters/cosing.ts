import { parseCas } from '../cas'
import type { CatalogueRecord, Row } from '../types'
import { cell } from '../util'

// UNVERIFIED headers: cosing.csv could not be downloaded (see data/sources/README.md).
export const COLUMNS = {
  name: 'INCI name',
  cas: 'CAS No',
  function: 'Function',
  restriction: 'Restriction',
} as const

// CosIng writes Annex II (banned) restrictions as "II/<n>".
const BANNED_RE = /^II\//

export function parseCosing(rows: Row[]): CatalogueRecord[] {
  const out: CatalogueRecord[] = []
  for (const row of rows) {
    const name = cell(row, COLUMNS.name)
    if (!name) continue
    out.push({
      name,
      aliases: [],
      // Cells like "56-81-5 / 25618-55-7": parseCas splits on spaces, so "/" must not glue them.
      cas: parseCas(cell(row, COLUMNS.cas).replaceAll('/', ' ')),
      functionNote: cell(row, COLUMNS.function).toLowerCase().replace(/\s+/g, ' '),
      euCosmeticsBanned: BANNED_RE.test(cell(row, COLUMNS.restriction)),
    })
  }
  return out
}
