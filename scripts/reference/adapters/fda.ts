import { parseCas } from '../cas'
import type { CatalogueRecord, Row } from '../types'
import { cell } from '../util'

/** Headers read from data/sources/fda-saf.csv (the FDA file, with its title lines above the header removed). */
export const COLUMNS = {
  cas: 'CAS Reg No (or other ID)',
  name: 'Substance',
  effect: 'Used for (Technical Effect)',
} as const

/** The FDA separates technical effects with ",<br />" and writes them in capitals. */
const effects = (text: string): string =>
  text
    .split(/<br\s*\/?>/i)
    .map((part) => part.replace(/,\s*$/, '').trim().toLowerCase())
    .filter(Boolean)
    .join(', ')

export function parseFda(rows: Row[]): CatalogueRecord[] {
  const out: CatalogueRecord[] = []
  for (const row of rows) {
    const name = cell(row, COLUMNS.name)
    if (!name) continue
    out.push({
      name,
      aliases: [],
      // The first column also holds other IDs; parseCas keeps only genuine CAS numbers.
      cas: parseCas(cell(row, COLUMNS.cas)),
      functionNote: effects(cell(row, COLUMNS.effect)),
      euCosmeticsBanned: false,
    })
  }
  return out
}
