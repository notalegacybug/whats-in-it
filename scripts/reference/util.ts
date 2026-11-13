import type { Row } from './types'

/** A cell's trimmed text; '' when the column is missing. */
export const cell = (row: Row, column: string): string => (row[column] ?? '').trim()

/** The latest plausible four-digit year in a cell ("2025 online", "September 2, 2011"), or null. */
export function latestYear(text: string): number | null {
  const years = [...text.matchAll(/\b(?:19|20)\d{2}\b/g)].map((m) => Number(m[0]))
  return years.length ? Math.max(...years) : null
}

/** A trailing parenthetical is a qualifier (not part of the name) only if it contains one of these words. */
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
  // plural and variant forms
  'mists',
  'dusts',
  'aerosols',
  'vapours',
  'vapors',
  'particulate',
  'fibrous',
]
const ROUTE_RE = new RegExp(`\\b(?:${ROUTE_WORDS.join('|')})\\b`, 'i')

/**
 * Splits "Titanium dioxide (airborne, unbound particles)" into the name and the
 * route/form text. Other trailing brackets stay in the name: "Chromium (hexavalent
 * compounds)" is a different substance from "Chromium", so dropping them would over-match.
 */
export function splitRouteQualifier(text: string): { name: string; qualifier?: string } {
  const m = /^(.*\S)\s*\(([^()]*)\)\s*$/.exec(text.trim())
  const qualifier = m?.[2].trim()
  return m && qualifier && ROUTE_RE.test(qualifier) ? { name: m[1].trim(), qualifier } : { name: text.trim() }
}

/**
 * Splits a trailing "(see ...)" / "(see also ...)" cross-reference off a name, even when it contains
 * nested brackets. The parent text matters: "Sulfuric Acid (see Strong Inorganic Acid Mists Containing
 * Sulfuric Acid)" is listed only as part of that mist exposure, so callers keep it as a qualifier.
 */
export function splitSeeReference(text: string): { name: string; seeAlso: string | null } {
  const m = /^(.*?)\s*\(see\b(.*)$/i.exec(text.trim())
  if (!m) return { name: text.trim(), seeAlso: null }
  const seeAlso = m[2].trim().replace(/^also\b\s*/i, '').replace(/\)\s*$/, '').trim()
  return { name: m[1].trim(), seeAlso: seeAlso || null }
}

/** Adds "Listed as part of: <parent>" to a listing qualifier (joined with "; " after any existing one). */
export function withSeeAlso(qualifier: string, seeAlso: string | null): string {
  return seeAlso ? [qualifier, `Listed as part of: ${seeAlso}`].filter(Boolean).join('; ') : qualifier
}
