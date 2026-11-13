import { parseCas } from '../cas'
import type { Row, SourceRecord } from '../types'
import { cell, latestYear, splitRouteQualifier } from '../util'

export const URL = 'https://oehha.ca.gov/proposition-65/proposition-65-list'

export const COLUMNS = {
  name: 'Chemical',
  toxicity: 'Type of Toxicity',
  cas: 'CAS No.',
  date: 'Date Listed',
} as const

export function parseProp65(rows: Row[]): SourceRecord[] {
  const out: SourceRecord[] = []
  for (const row of rows) {
    // "cancer" may be one of several toxicities ("cancer, developmental, male").
    if (!/\bcancer\b/i.test(cell(row, COLUMNS.toxicity))) continue
    const { name, qualifier } = splitRouteQualifier(cell(row, COLUMNS.name))
    if (!name) continue

    out.push({
      name,
      cas: parseCas(cell(row, COLUMNS.cas)),
      listing: {
        source: 'PROP65',
        classification: 'Listed as causing cancer',
        level: 'possible',
        year: latestYear(cell(row, COLUMNS.date)),
        url: URL,
        ...(qualifier && { qualifier }),
      },
    })
  }
  return out
}
