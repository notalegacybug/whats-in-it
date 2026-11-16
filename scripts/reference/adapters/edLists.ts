import { parseCas } from '../cas'
import type { Listing, Row, SourceRecord } from '../types'
import { cell, latestYear } from '../util'

// Written by scripts/fetch-edlists.mjs from https://edlists.org.
export const COLUMNS = { name: 'Name', cas: 'CAS', health: 'Health effects', year: 'Year', list: 'List' } as const

const LISTS: Record<string, { classification: string; level: Listing['level']; url: string }> = {
  'List I': {
    classification: 'Identified as an endocrine disruptor at EU level',
    level: 'strong',
    url: 'https://edlists.org/the-ed-lists/list-i-substances-identified-as-endocrine-disruptors-by-the-eu',
  },
  'List II': {
    classification: 'Under EU evaluation for endocrine disruption',
    level: 'possible',
    url: 'https://edlists.org/the-ed-lists/list-ii-substances-under-eu-investigation-endocrine-disruption',
  },
  'List III': {
    classification: 'Considered an endocrine disruptor by a national authority',
    level: 'possible',
    url: 'https://edlists.org/the-ed-lists/list-iii-substances-identified-as-endocrine-disruptors-by-participating-national-authorities',
  },
}

// Only rows marked for human health: many List I rows concern wildlife only, which a label check is not about.
export function parseEdLists(rows: Row[]): SourceRecord[] {
  const years = new Map<string, number | null>()
  const order: { name: string; cas: string; list: string }[] = []
  for (const row of rows) {
    const list = cell(row, COLUMNS.list)
    if (!LISTS[list] || cell(row, COLUMNS.health).toLowerCase() !== 'yes') continue
    const year = latestYear(cell(row, COLUMNS.year))
    const casNumbers = parseCas(cell(row, COLUMNS.cas).replaceAll(',', ' '))
    for (const name of cell(row, COLUMNS.name).split(';').map((n) => n.trim()).filter(Boolean)) {
      // A row with two CAS numbers names two listed substances.
      for (const cas of casNumbers.length ? casNumbers : ['']) {
        const key = `${list}|${name}|${cas}`
        if (!years.has(key)) order.push({ name, cas, list })
        years.set(key, Math.max(years.get(key) ?? 0, year ?? 0) || null)
      }
    }
  }
  return order.map(({ name, cas, list }) => ({
    name,
    cas: cas ? [cas] : [],
    listing: {
      source: 'ED_LISTS',
      hazard: 'hormone',
      classification: LISTS[list].classification,
      level: LISTS[list].level,
      year: years.get(`${list}|${name}|${cas}`) ?? null,
      url: LISTS[list].url,
    },
  }))
}
