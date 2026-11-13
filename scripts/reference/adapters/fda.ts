import { parseCas } from '../cas'
import type { CatalogueRecord, Row } from '../types'
import { cell } from '../util'

/** Headers read from data/sources/fda-saf.csv (the FDA file, with its title lines above the header removed). */
export const COLUMNS = {
  cas: 'CAS Reg No (or other ID)',
  name: 'Substance',
  effect: 'Used for (Technical Effect)',
} as const

/** The FDA separates technical effects with ",<br />" and writes them in capitals. */
const effects = (text: string): string =>
  text
    .split(/<br\s*\/?>/i)
    .map((part) => part.replace(/,\s*$/, '').trim().toLowerCase())
    .filter(Boolean)
    .join(', ')

/** Words kept in capitals when an all-capitals FDA name is made readable (matched whole-word, any case). */
export const KEEP_UPPER = ['EDTA', 'PEG', 'PPG', 'BHA', 'BHT', 'DNA', 'RNA', 'USP', 'NF', 'HCL', 'TBHQ', 'MSG', 'CI', 'NO.']

const ROMAN = 'xii|xi|x|ix|viii|vii|vi|v|iv|iii|ii|i'
const NOT_ALNUM_BEFORE = '(?<![a-z0-9])'

/**
 * Turns an ALL-CAPITALS FDA name into a readable one: "SULFURIC ACID" -> "Sulfuric acid". Lower-cases, then
 * restores capitals for the few things that need them (FD&C, listed acronyms, Roman numerals, vitamin
 * letters, L-/DL-/N,N- prefixes, the first word in brackets, "L." authority). Display only: matching
 * normalises names to lower case anyway. Perfect chemical capitalisation is not the goal.
 */
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

/** What the FDA's `--CODE` name suffixes mean. An unknown code is shown as written. */
const STATUS_TEXT: Record<string, string> = {
  NLFG: 'not listed for general food use',
  PROHIBITED: 'prohibited in food',
  'PROHIBITED WITH EXCEPTIONS': 'prohibited in food, with exceptions',
  DELISTED: 'delisted (no longer permitted)',
}

/**
 * The FDA appends a status code ("CYCLAMATE--PROHIBITED", "--NLFG") to names. It is not part of the
 * substance's name, so it is split off (otherwise "cyclamate" on a label would not match), but it is the
 * only place the FDA records the status, so it is kept: the merge shows it in the entry's functionNote.
 */
function splitStatus(raw: string): { name: string; status?: string } {
  const m = /^(.*?)\s*--\s*([A-Z][A-Z ]*)$/.exec(raw.trim())
  if (!m) return { name: raw.trim() }
  const code = m[2].trim()
  return { name: m[1].trim(), status: STATUS_TEXT[code] ?? code }
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
      ...(split.status && { fdaStatus: split.status }),
    })
  }
  return out
}
