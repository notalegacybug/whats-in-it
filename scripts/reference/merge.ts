import type { Listing, RefEntry, Reference } from '../../src/reference/types'
import { normalizeName } from '../../src/ingredients/normalize'
import type { CatalogueRecord, NotesFile, SourceRecord } from './types'

const MIN_ALIAS_LENGTH = 3

interface Group {
  id: string
  flagged: SourceRecord[]
  catalogue: CatalogueRecord[]
}

export interface MergeInput {
  flagged: SourceRecord[]
  catalogue: CatalogueRecord[]
  notes: NotesFile
  // No-CAS flagged names a person allow-listed.
  caslessAllow: Set<string>
  version: string
  builtAt: string
}

const casId = (cas: string) => `cas:${cas}`
const nameId = (normalised: string) => `name:${normalised}`

const namesOfCatalogue = (r: CatalogueRecord) => [r.name, ...r.aliases].map(normalizeName)

// Merge by CAS first: names are ambiguous, and a wrong link becomes a wrong health verdict.
export function mergeReference(a: MergeInput): { reference: Reference; missingNotes: string[] } {
  const groups = new Map<string, Group>()
  const group = (id: string): Group => {
    let g = groups.get(id)
    if (!g) groups.set(id, (g = { id, flagged: [], catalogue: [] }))
    return g
  }

  for (const r of a.flagged) {
    if (r.cas.length) group(casId(r.cas[0])).flagged.push(r)
  }
  for (const r of a.catalogue) {
    if (r.cas.length) group(casId(r.cas[0])).catalogue.push(r)
  }

  for (const r of a.flagged) {
    const normalised = normalizeName(r.name)
    if (!r.cas.length && normalised && a.caslessAllow.has(normalised)) group(nameId(normalised)).flagged.push(r)
  }

  // The index is a snapshot of CAS-keyed groups, so the result does not depend on record order.
  const byName = new Map<string, Set<string>>()
  for (const g of groups.values()) {
    if (!g.id.startsWith('cas:')) continue
    for (const n of [...g.flagged.map((r) => normalizeName(r.name)), ...g.catalogue.flatMap(namesOfCatalogue)]) {
      if (!byName.has(n)) byName.set(n, new Set())
      byName.get(n)!.add(g.id)
    }
  }
  for (const r of a.catalogue) {
    if (r.cas.length) continue
    const normalised = normalizeName(r.name)
    if (!normalised) continue
    const homes = byName.get(normalised)
    if (homes && homes.size > 1) continue // fits two entries: leave it out rather than guess
    group(homes ? [...homes][0] : nameId(normalised)).catalogue.push(r)
  }

  const entries = [...groups.values()].map((g) => toEntry(g, a.notes))
  cleanAliases(entries)
  entries.sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0))

  const missingNotes = [...groups.values()]
    .filter((g) => g.flagged.length > 0 && g.catalogue.length > 0 && !a.notes[g.id])
    .map((g) => g.id)
    .sort()

  return { reference: { version: a.version, builtAt: a.builtAt, entries }, missingNotes }
}

function toEntry(g: Group, notes: NotesFile): RefEntry {
  const flaggedNames = g.flagged.map((r) => r.name)
  // The catalogue's name is the one people see on labels; otherwise the shortest flagged name, ties alphabetical.
  const name =
    g.catalogue[0]?.name ?? [...flaggedNames].sort((x, y) => x.length - y.length || (x < y ? -1 : x > y ? 1 : 0))[0]
  const own = normalizeName(name)

  const aliases = [...new Set([...flaggedNames, ...g.catalogue.flatMap((r) => [r.name, ...r.aliases])].map(normalizeName))]
    .filter((n) => n !== own && n.length >= MIN_ALIAS_LENGTH)
    .sort()

  const listings = uniqueListings(g.flagged.map((r) => r.listing))
  // A regulatory status is context only: not a listing, changes no verdict.
  const regulatoryNote = g.catalogue.map((r) => r.regulatoryNote).find(Boolean)
  const functionNote =
    [g.catalogue.map((r) => r.functionNote).find(Boolean), regulatoryNote && `Regulatory note: ${regulatoryNote}`]
      .filter(Boolean)
      .join(' · ') || undefined
  const note = notes[g.id]

  return {
    id: g.id,
    name,
    aliases,
    cas: [...new Set([...g.flagged, ...g.catalogue].flatMap((r) => r.cas))],
    listings,
    ...(note && { note: note.note, ...(note.caveat && { caveat: note.caveat }) }),
    ...(functionNote && { functionNote }),
    // The ban only matters next to a hazard listing; on an ordinary ingredient it would just be noise.
    ...(listings.length > 0 && g.catalogue.some((r) => r.euCosmeticsBanned) && { euCosmeticsBanned: true }),
  }
}

// Dedupes and orders listings so builds are repeatable.
function uniqueListings(listings: Listing[]): Listing[] {
  const seen = new Set<string>()
  const out: Listing[] = []
  for (const l of listings) {
    const key = JSON.stringify([l.source, l.classification, l.level, l.year, l.url, l.qualifier ?? null, l.edition ?? null])
    if (!seen.has(key)) {
      seen.add(key)
      out.push(l)
    }
  }
  const sortKey = (l: Listing) => `${l.source}|${l.classification}|${l.qualifier ?? ''}|${l.edition ?? ''}`
  return out.sort((x, y) => (sortKey(x) < sortKey(y) ? -1 : sortKey(x) > sortKey(y) ? 1 : 0))
}

// A shared alias would send a label to the wrong entry, so it is dropped (main names stay).
function cleanAliases(entries: RefEntry[]): void {
  const mainNames = new Map<string, Set<string>>()
  const holders = new Map<string, number>()
  for (const e of entries) {
    const own = normalizeName(e.name)
    if (!mainNames.has(own)) mainNames.set(own, new Set())
    mainNames.get(own)!.add(e.id)
    for (const alias of e.aliases) holders.set(alias, (holders.get(alias) ?? 0) + 1)
  }
  for (const e of entries) {
    e.aliases = e.aliases.filter((alias) => {
      const owners = mainNames.get(alias)
      const isOthersMainName = owners !== undefined && [...owners].some((id) => id !== e.id)
      return !isOthersMainName && holders.get(alias) === 1
    })
  }
}
