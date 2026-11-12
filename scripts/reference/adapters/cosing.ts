import { parseCas } from '../cas'
import type { CatalogueRecord, Row } from '../types'
import { cell } from '../util'

/**
 * Headers read from data/sources/cosing.csv. UNVERIFIED: the file could not be downloaded, so these
 * names are assumptions (see data/sources/README.md). Compare with the real header row when it arrives.
 */
export const COLUMNS = {
  name: 'INCI name',
  cas: 'CAS No',
  function: 'Function',
  restriction: 'Restriction',
} as const

/** Annex II of the EU Cosmetics Regulation lists banned substances; CosIng writes those restrictions as "II/<n>". */
const BANNED_RE = /^II\//

export function parseCosing(rows: Row[]): CatalogueRecord[] {
  const out: CatalogueRecord[] = []
  for (const row of rows) {
    const name = cell(row, COLUMNS.name)
    if (!name) continue
    out.push({
      name,
      aliases: [],
      // CosIng writes several numbers as "56-81-5 / 25618-55-7"; parseCas splits on spaces, so "/" must not glue them.
      cas: parseCas(cell(row, COLUMNS.cas).replaceAll('/', ' ')),
      functionNote: cell(row, COLUMNS.function).toLowerCase().replace(/\s+/g, ' '),
      euCosmeticsBanned: BANNED_RE.test(cell(row, COLUMNS.restriction)),
    })
  }
  return out
}
