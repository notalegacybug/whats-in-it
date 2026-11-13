import type { Row, SourceRecord } from './types'

export const cell = (row: Row, column: string): string => (row[column] ?? '').trim()

export function latestYear(text: string): number | null {
  const years = [...text.matchAll(/\b(?:19|20)\d{2}\b/g)].map((m) => Number(m[0]))
  return years.length ? Math.max(...years) : null
}

// A trailing bracket is a qualifier only if it contains one of these words.
export const ROUTE_WORDS = [
  'airborne',
  'inhalation',
  'inhalable',
  'respirable',
  'oral',
  'dermal',
  'particles',
  'fibres',
  'fibers',
  'dust',
  'unbound',
  'aerosol',
  'mist',
  'vapour',
  'vapor',
  'mists',
  'dusts',
  'aerosols',
  'vapours',
  'vapors',
  'particulate',
  'fibrous',
]
const ROUTE_RE = new RegExp(`\\b(?:${ROUTE_WORDS.join('|')})\\b`, 'i')

// Other brackets stay: "Chromium (hexavalent compounds)" is a different substance from "Chromium".
export function splitRouteQualifier(text: string): { name: string; qualifier?: string } {
  const m = /^(.*\S)\s*\(([^()]*)\)\s*$/.exec(text.trim())
  const qualifier = m?.[2].trim()
  return m && qualifier && ROUTE_RE.test(qualifier) ? { name: m[1].trim(), qualifier } : { name: text.trim() }
}

// "(see ...)" means listed only as part of the parent, so callers keep it as a qualifier.
export function splitSeeReference(text: string): { name: string; seeAlso: string | null } {
  const m = /^(.*?)\s*\(see\b(.*)$/i.exec(text.trim())
  if (!m) return { name: text.trim(), seeAlso: null }
  const seeAlso = m[2].trim().replace(/^also\b\s*/i, '').replace(/\)\s*$/, '').trim()
  return { name: m[1].trim(), seeAlso: seeAlso || null }
}

export function withSeeAlso(qualifier: string, seeAlso: string | null): string {
  return seeAlso ? [qualifier, `Listed as part of: ${seeAlso}`].filter(Boolean).join('; ') : qualifier
}

export function withEdition(records: SourceRecord[], edition: string | undefined): SourceRecord[] {
  return edition ? records.map((r) => ({ ...r, listing: { ...r.listing, edition } })) : records
}
