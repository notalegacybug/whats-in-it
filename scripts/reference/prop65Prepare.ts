// Turns OEHHA's downloaded p65chemicalslist.csv into the plain table the Prop 65 adapter reads.
// The download has title rows, footnotes, group members as indented sub-rows, and removed chemicals marked
// "Delisted <date>" in the name (shown as strikeout on the website).

const HEADER = ['Chemical', 'Type of Toxicity', 'Listing Mechanism', 'CAS No.', 'Date Listed']
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
// Dose notes under a chemical ("Adult", "Infant boys, ...") and footnotes ("a Where a source ...") are not chemicals.
const NOT_A_CHEMICAL = /^(adult|infant|neonatal|child)|^[a-z] [A-Z]/i

export type Prop65Row = { Chemical: string; 'Type of Toxicity': string; 'CAS No.': string; 'Date Listed': string }

// "1-Jan-90" -> "1990-01-01". The list began in 1987, so two-digit years 87-99 are 19xx and the rest 20xx.
function isoDate(text: string): string {
  const m = /^(\d{1,2})-([A-Za-z]{3})-(\d{2})$/.exec(text.trim())
  if (!m) return text.trim()
  const month = MONTHS.indexOf(m[2].toLowerCase()) + 1
  const yy = Number(m[3])
  const year = yy >= 87 ? 1900 + yy : 2000 + yy
  return `${year}-${String(month).padStart(2, '0')}-${m[1].padStart(2, '0')}`
}

// Only notes in brackets go ("[Basis for listing changed ...]"); "Dibenzo[a,h]pyrene" is a chemical name.
const NOTE_BRACKET = /\[[^\]]*\b(?:basis|click|listing|delist\w*)\b[^\]]*\]/gi

const cleanName = (name: string) =>
  name
    .replace(NOTE_BRACKET, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export function prepareProp65(raw: string[][]): Prop65Row[] {
  const start = raw.findIndex((r) => HEADER.every((h, i) => (r[i] ?? '').trim() === h))
  if (start < 0) throw new Error(`Prop 65: no header row with ${HEADER.join(', ')}`)
  const out: Prop65Row[] = []
  let parent: Prop65Row | null = null
  for (const r of raw.slice(start + 1)) {
    const [name = '', toxicity = '', , cas = '', date = ''] = r
    if (!name.trim()) continue
    if (/\bdelisted\b/i.test(name)) {
      parent = null // its sub-rows must not inherit a removed listing
      continue
    }
    if (toxicity.trim()) {
      parent = {
        Chemical: cleanName(name),
        'Type of Toxicity': toxicity.replace(/\s+/g, ' ').trim(),
        'CAS No.': cas.trim(),
        'Date Listed': isoDate(date),
      }
      out.push(parent)
    } else if (parent && !NOT_A_CHEMICAL.test(name.trim())) {
      // A named member of the group above ("Lead" under "Lead and lead compounds") carries its listing.
      out.push({ ...parent, Chemical: cleanName(name) })
    }
  }
  return out
}
