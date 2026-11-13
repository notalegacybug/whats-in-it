import { parseCas } from '../cas'
import type { CatalogueRecord, Row } from '../types'
import { cell } from '../util'

// Headers as written by scripts/fetch-cosing.mjs.
export const COLUMNS = {
  name: 'INCI name',
  cas: 'CAS No',
  function: 'Function',
  restriction: 'Restriction',
} as const

// CosIng writes Annex II (banned) restrictions as "II/<n>".
const BANNED_RE = /^II\//

// CosIng sometimes repeats a function in one cell ("COLORANT, COLORANT").
const functions = (text: string) =>
  [...new Set(text.toLowerCase().replace(/\s+/g, ' ').split(',').map((f) => f.trim()).filter(Boolean))].join(', ')

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
      functionNote: functions(cell(row, COLUMNS.function)),
      euCosmeticsBanned: BANNED_RE.test(cell(row, COLUMNS.restriction)),
    })
  }
  return out
}
