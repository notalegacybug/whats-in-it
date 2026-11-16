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

// Prop 65's reproductive endpoints: developmental, female and male reproductive toxicity.
const REPRODUCTIVE = /\b(developmental|female|male)\b/gi

export function parseProp65(rows: Row[]): SourceRecord[] {
  const out: SourceRecord[] = []
  for (const row of rows) {
    const toxicity = cell(row, COLUMNS.toxicity)
    const { name, qualifier } = splitRouteQualifier(cell(row, COLUMNS.name))
    if (!name) continue
    const base = { name, cas: parseCas(cell(row, COLUMNS.cas)) }
    const common = { source: 'PROP65', level: 'possible', year: latestYear(cell(row, COLUMNS.date)), url: URL, ...(qualifier && { qualifier }) } as const

    // "cancer" may be one of several toxicities ("cancer, developmental, male").
    if (/\bcancer\b/i.test(toxicity)) out.push({ ...base, listing: { ...common, classification: 'Listed as causing cancer' } })

    const reproductive = [...new Set([...toxicity.matchAll(REPRODUCTIVE)].map((m) => m[1].toLowerCase()))]
    if (reproductive.length) {
      out.push({
        ...base,
        listing: {
          ...common,
          hazard: 'reproductive',
          classification: `Listed as causing developmental or reproductive harm (${reproductive.join(', ')})`,
        },
      })
    }
  }
  return out
}
