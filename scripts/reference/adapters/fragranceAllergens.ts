import { parseCas } from '../cas'
import type { FragranceAllergen, Row } from '../types'
import { cell } from '../util'

// Written by scripts/fetch-fragrance-allergens.mjs from CosIng Annex III.
export const COLUMNS = { name: 'Name', chemical: 'Chemical name', cas: 'CAS', ref: 'Annex III ref' } as const

export function parseFragranceAllergens(rows: Row[]): FragranceAllergen[] {
  const out: FragranceAllergen[] = []
  for (const row of rows) {
    const names = cell(row, COLUMNS.name).split(';').map((n) => n.trim()).filter(Boolean)
    if (!names.length) continue
    out.push({ names, cas: parseCas(cell(row, COLUMNS.cas).replace(/[;/]/g, ' ')) })
  }
  return out
}
