import { parseCas } from '../cas'
import type { Listing, Row, SourceRecord } from '../types'
import { cell, splitRouteQualifier } from '../util'

export const URL = 'https://echa.europa.eu/information-on-chemicals/annex-vi-to-clp'

/** Headers read from data/sources/eu-clp.csv. */
export const COLUMNS = {
  name: 'International Chemical Identification',
  cas: 'CAS No',
  hazard: 'Hazard Class and Category Code(s)',
} as const

// Strongest first: a substance with several Carc. codes keeps the most serious.
const CATEGORIES: { code: string; level: Listing['level'] }[] = [
  { code: '1A', level: 'strong' },
  { code: '1B', level: 'strong' },
  { code: '2', level: 'possible' },
]

/** One cell holds several hazard codes ("Flam. Liq. 2\nCarc. 1B"); split on newlines, `;`, and commas outside brackets. */
const splitCodes = (text: string) => text.split(/[\n;]|,(?![^(]*\))/).map((s) => s.trim())

function carcinogenicity(hazardCell: string): { classification: string; level: Listing['level']; route?: string } | null {
  const found = splitCodes(hazardCell)
    .map((code) => /^Carc\.\s*(1A|1B|2)\b\s*(?:\(([^)]*)\))?/.exec(code))
    .filter((m) => m !== null)
  for (const { code, level } of CATEGORIES) {
    const hit = found.find((m) => m[1] === code)
    if (hit) return { classification: `Carc. ${code}`, level, route: hit[2]?.trim() || undefined }
  }
  return null
}

export function parseEuClp(rows: Row[], annexYear: number): SourceRecord[] {
  const out: SourceRecord[] = []
  for (const row of rows) {
    const { name, qualifier: nameQualifier } = splitRouteQualifier(cell(row, COLUMNS.name))
    const carc = carcinogenicity(cell(row, COLUMNS.hazard))
    if (!name || !carc) continue

    const qualifier = [nameQualifier, carc.route].filter(Boolean).join('; ')
    out.push({
      name,
      cas: parseCas(cell(row, COLUMNS.cas)),
      listing: {
        source: 'EU_CLP',
        classification: carc.classification,
        level: carc.level,
        year: annexYear,
        url: URL,
        ...(qualifier && { qualifier }),
      },
    })
  }
  return out
}
