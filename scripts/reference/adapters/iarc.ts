import { parseCas } from '../cas'
import type { Listing, Row, SourceRecord } from '../types'
import { cell, latestYear, splitSeeReference, withSeeAlso } from '../util'

export const URL = 'https://monographs.iarc.who.int/list-of-classifications'

/** Headers read from data/sources/iarc.csv. */
export const COLUMNS = {
  cas: 'CAS No.',
  name: 'Agent',
  group: 'Group',
  year: 'Volume publication year',
  info: 'Additional information',
} as const

// Group 3 (not classifiable) and 4 (probably not carcinogenic) are deliberately absent.
const LEVELS: Record<string, Listing['level']> = { '1': 'strong', '2A': 'possible', '2B': 'possible' }

export function parseIarc(rows: Row[]): SourceRecord[] {
  const out: SourceRecord[] = []
  for (const row of rows) {
    const { name, seeAlso } = splitSeeReference(cell(row, COLUMNS.name))
    const group = cell(row, COLUMNS.group).toUpperCase()
    const level = LEVELS[group]
    if (!name || !level) continue

    const qualifier = withSeeAlso(cell(row, COLUMNS.info), seeAlso)
    out.push({
      name,
      cas: parseCas(cell(row, COLUMNS.cas)),
      listing: {
        source: 'IARC',
        classification: `Group ${group}`,
        level,
        year: latestYear(cell(row, COLUMNS.year)),
        url: URL,
        ...(qualifier && { qualifier }),
      },
    })
  }
  return out
}
