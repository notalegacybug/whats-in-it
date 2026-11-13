import { parseCas } from '../cas'
import type { CatalogueRecord, Row } from '../types'
import { cell } from '../util'

// Headers of fda-saf.csv once the title lines above the header are removed.
export const COLUMNS = {
  cas: 'CAS Reg No (or other ID)',
  name: 'Substance',
  effect: 'Used for (Technical Effect)',
} as const

const effects = (text: string): string =>
  text
    .split(/<br\s*\/?>/i)
    .map((part) => part.replace(/,\s*$/, '').trim().toLowerCase())
    .filter(Boolean)
    .join(', ')

export const KEEP_UPPER = ['EDTA', 'PEG', 'PPG', 'BHA', 'BHT', 'DNA', 'RNA', 'USP', 'NF', 'HCL', 'TBHQ', 'MSG', 'CI', 'NO.']

const ROMAN = 'xii|xi|x|ix|viii|vii|vi|v|iv|iii|ii|i'
const NOT_ALNUM_BEFORE = '(?<![a-z0-9])'

// Display only (matching lower-cases names anyway); perfect chemical capitalisation is not the goal.
export function readableName(upper: string): string {
  let s = upper.toLowerCase()
  s = s.replace(/[a-z]*&[a-z]*/g, (m) => m.toUpperCase())
  for (const word of KEEP_UPPER) {
    const form = word === 'NO.' ? 'No.' : word
    const escaped = word.toLowerCase().replace('.', '[.]')
    s = s.replace(new RegExp(`${NOT_ALNUM_BEFORE}${escaped}(?![a-z0-9])`, 'g'), form)
  }
  s = s.replace(new RegExp(`${NOT_ALNUM_BEFORE}(${ROMAN})(?![a-z0-9])`, 'g'), (m) => m.toUpperCase())
  s = s.replace(/vitamin ([a-z])(?![a-z])(-\d+)?/g, (_m, letter: string, digits = '') => `vitamin ${letter.toUpperCase()}${digits}`)
  s = s.replace(new RegExp(`${NOT_ALNUM_BEFORE}(dl|l|d|n,n|n|o|s|c)(?=-)`, 'g'), (m) => m.toUpperCase())
  s = s.replace(/\(([a-z])/g, (_m, c: string) => `(${c.toUpperCase()}`)
  s = s.replace(/(?<![a-z0-9])l\.(?=\)|\s|$)/g, 'L.')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// NLFG is a FEMA (flavour industry) status, not the FDA's; unknown codes are attributed to the file.
const STATUS_TEXT: Record<string, string> = {
  NLFG: 'Flavour industry (FEMA): no longer listed as GRAS',
  PROHIBITED: 'US FDA: prohibited in food',
  'PROHIBITED WITH EXCEPTIONS': 'US FDA: prohibited in food, with exceptions',
  DELISTED: 'US FDA: delisted (no longer permitted)',
}

// The status suffix is split off so names match, but kept: it is the file's only status record.
function splitStatus(raw: string): { name: string; status?: string } {
  const m = /^(.*?)\s*--\s*([A-Z][A-Z ]*)$/.exec(raw.trim())
  if (!m) return { name: raw.trim() }
  const code = m[2].trim()
  return { name: m[1].trim(), status: STATUS_TEXT[code] ?? `US FDA: ${code}` }
}

export function parseFda(rows: Row[]): CatalogueRecord[] {
  const out: CatalogueRecord[] = []
  for (const row of rows) {
    const split = splitStatus(cell(row, COLUMNS.name))
    if (!split.name) continue
    const name = split.name === split.name.toUpperCase() ? readableName(split.name) : split.name
    out.push({
      name,
      aliases: [],
      // The first column also holds other IDs; parseCas keeps only genuine CAS numbers.
      cas: parseCas(cell(row, COLUMNS.cas)),
      functionNote: effects(cell(row, COLUMNS.effect)),
      euCosmeticsBanned: false,
      ...(split.status && { regulatoryNote: split.status }),
    })
  }
  return out
}
