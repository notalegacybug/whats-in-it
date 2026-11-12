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

/** Drops a trailing "(see ...)" / "(see also ...)" cross-reference, even when it contains nested brackets. */
export const stripSeeReference = (name: string): string => name.replace(/\s*\(see\b.*$/i, '').trim()
