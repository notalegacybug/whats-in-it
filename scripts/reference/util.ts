import type { Row } from './types'

/** A cell's trimmed text; '' when the column is missing. */
export const cell = (row: Row, column: string): string => (row[column] ?? '').trim()

/** The latest plausible four-digit year in a cell ("2025 online", "September 2, 2011"), or null. */
export function latestYear(text: string): number | null {
  const years = [...text.matchAll(/\b(?:19|20)\d{2}\b/g)].map((m) => Number(m[0]))
  return years.length ? Math.max(...years) : null
}

/**
 * Splits "Titanium dioxide (airborne, unbound particles)" into the name and the
 * bracketed text. Only a parenthetical at the very end counts, and only when
 * something is left of it, so a name that is all brackets stays whole.
 */
export function splitTrailingParenthetical(text: string): { name: string; qualifier?: string } {
  const m = /^(.*\S)\s*\(([^()]*)\)\s*$/.exec(text.trim())
  const qualifier = m?.[2].trim()
  return m && qualifier ? { name: m[1].trim(), qualifier } : { name: text.trim() }
}
