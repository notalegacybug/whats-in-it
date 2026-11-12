import { parseCas } from '../cas'
import type { Listing, Row, SourceRecord } from '../types'
import { cell, latestYear } from '../util'

export const URL = 'https://ntp.niehs.nih.gov/go/roc'

/** Headers read from data/sources/ntp.csv (a file we write ourselves; the NTP publishes no CSV). */
export const COLUMNS = { name: 'Name', cas: 'CAS', listing: 'Listing', year: 'Year' } as const

const LEVELS: Record<string, Listing['level']> = {
  'known to be a human carcinogen': 'strong',
  'reasonably anticipated to be a human carcinogen': 'possible',
}

/** "Estradiol-17B (see Estrogens, Steroidal)": the cross-reference is not part of the substance's name. */
const SEE_REFERENCE = /\s*\(see [^)]*\)\s*$/i

export function parseNtp(rows: Row[]): SourceRecord[] {
  const out: SourceRecord[] = []
  for (const row of rows) {
    const name = cell(row, COLUMNS.name).replace(SEE_REFERENCE, '')
    const classification = cell(row, COLUMNS.listing)
    const level = LEVELS[classification.toLowerCase()]
    if (!name || !level) continue

    out.push({
      name,
      cas: parseCas(cell(row, COLUMNS.cas)),
      listing: { source: 'NTP', classification, level, year: latestYear(cell(row, COLUMNS.year)), url: URL },
    })
  }
  return out
}
