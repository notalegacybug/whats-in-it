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

const ENDPOINT_ORDER = ['developmental', 'female', 'male']

export function parseProp65(rows: Row[]): SourceRecord[] {
  return mergeReproductive(parseRows(rows))
}

// OEHHA lists some chemicals once per endpoint ("developmental" 1991, "female" 2009): one listing each, latest year.
function mergeReproductive(records: SourceRecord[]): SourceRecord[] {
  const merged = new Map<string, SourceRecord>()
  const out: SourceRecord[] = []
  for (const r of records) {
    if (r.listing.hazard !== 'reproductive') {
      out.push(r)
      continue
    }
    const key = `${r.name}|${r.cas.join(',')}|${r.listing.qualifier ?? ''}`
    const seen = merged.get(key)
    if (!seen) {
      merged.set(key, r)
      out.push(r)
      continue
    }
    const endpoints = (l: SourceRecord['listing']) => /\(([^)]*)\)$/.exec(l.classification)?.[1].split(', ') ?? []
    const all = [...new Set([...endpoints(seen.listing), ...endpoints(r.listing)])].sort(
      (a, b) => ENDPOINT_ORDER.indexOf(a) - ENDPOINT_ORDER.indexOf(b),
    )
    seen.listing = {
      ...seen.listing,
      classification: `Listed as causing developmental or reproductive harm (${all.join(', ')})`,
      year: Math.max(seen.listing.year ?? 0, r.listing.year ?? 0) || null,
    }
  }
  return out
}

function parseRows(rows: Row[]): SourceRecord[] {
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
