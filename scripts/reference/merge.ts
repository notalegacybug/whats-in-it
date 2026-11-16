import type { Listing, RefEntry, Reference } from '../../src/reference/types'
import { normalizeName } from '../../src/ingredients/normalize'
import type { CatalogueRecord, CommonNameGroup, NotesFile, SourceRecord } from './types'

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
  // Name-only sources, highest rank first (e.g. FDA GSRS); they add everyday names, never listings.
  commonNames?: CommonNameGroup[][]
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

  mergeSameMainName(groups)
  const entries = [...groups.values()].map((g) => toEntry(g, a.notes))
  cleanAliases(entries)
  cleanCas(entries)
  addCommonNames(entries, a.commonNames ?? [])
  entries.sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0))

  const missingNotes = [...groups.values()]
    // Hand-written notes are required for cancer listings; hormone and reproductive entries show their function text.
    .filter((g) => g.flagged.some((r) => (r.listing.hazard ?? 'cancer') === 'cancer') && g.catalogue.length > 0 && !a.notes[g.id])
    .map((g) => g.id)
    .sort()

  return { reference: { version: a.version, builtAt: a.builtAt, entries }, missingNotes }
}

// The catalogue's name is the one people see on labels; otherwise the shortest flagged name, ties alphabetical.
const mainName = (g: Group) =>
  g.catalogue[0]?.name ??
  g.flagged.map((r) => r.name).sort((x, y) => x.length - y.length || (x < y ? -1 : x > y ? 1 : 0))[0]

// A label only gives a name, so entries sharing a main name (e.g. two CAS forms of lead acetate) become one;
// a listed group absorbs the others so the name never resolves to an unlisted twin.
function mergeSameMainName(groups: Map<string, Group>): void {
  const byName = new Map<string, Group[]>()
  for (const g of groups.values()) {
    const n = normalizeName(mainName(g))
    if (!byName.has(n)) byName.set(n, [])
    byName.get(n)!.push(g)
  }
  for (const same of byName.values()) {
    if (same.length < 2) continue
    same.sort((x, y) => Number(y.flagged.length > 0) - Number(x.flagged.length > 0) || (x.id < y.id ? -1 : 1))
    const [target, ...rest] = same
    for (const g of rest) {
      target.flagged.push(...g.flagged)
      target.catalogue.push(...g.catalogue)
      groups.delete(g.id)
    }
  }
}

function toEntry(g: Group, notes: NotesFile): RefEntry {
  const flaggedNames = g.flagged.map((r) => r.name)
  const name = mainName(g)
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
    const key = JSON.stringify([l.source, l.hazard ?? null, l.classification, l.level, l.year, l.url, l.qualifier ?? null, l.edition ?? null])
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

// Like aliases: a CAS number on two entries is kept only where it is the main number, else dropped.
function cleanCas(entries: RefEntry[]): void {
  const holders = new Map<string, number>()
  for (const e of entries) for (const c of e.cas) holders.set(c, (holders.get(c) ?? 0) + 1)
  for (const e of entries) e.cas = e.cas.filter((c) => holders.get(c) === 1 || e.id === casId(c))
}

const MAX_COMMON_NAME_WORDS = 6
const MAX_COMMON_NAME_LENGTH = 60
const VAGUE = new Set(['oil', 'oils', 'extract', 'butter', 'wax', 'water', 'powder', 'juice', 'fat', 'flour', 'leaf', 'root', 'seed', 'acid', 'salt', 'resin', 'gum'])
const withoutBrackets = (n: string) => normalizeName(n.replace(/\([^)]*\)/g, ' '))

function usableCommonName(n: string): boolean {
  const words = n.split(' ')
  return (
    n.length >= MIN_ALIAS_LENGTH + 1 &&
    n.length <= MAX_COMMON_NAME_LENGTH &&
    words.length <= MAX_COMMON_NAME_WORDS &&
    /[a-z]/.test(n) &&
    !/[,;:.]/.test(n) &&
    !/\bimpurity\b|\brelated compound\b|^nci-/.test(n) &&
    !(words.length === 1 && VAGUE.has(n))
  )
}

// Ranked: a name is added only if no existing entry uses it, its substance maps to exactly one entry, and no
// other substance in the same source claims it. Higher-ranked sources claim names before lower ones.
function addCommonNames(entries: RefEntry[], sources: CommonNameGroup[][]): void {
  const owner = new Map<string, RefEntry>()
  const claim = (key: string, e: RefEntry) => {
    if (!owner.has(key)) owner.set(key, e)
  }
  for (const e of entries) for (const k of [e.name, ...e.aliases].map(normalizeName)) claim(k, e)
  const taken = new Set(owner.keys())

  for (const groups of sources) {
    const proposals = new Map<string, Set<RefEntry>>()
    for (const g of groups) {
      const homes = new Set<RefEntry>()
      for (const n of g.joinNames) {
        for (const k of [normalizeName(n), withoutBrackets(n)]) {
          const e = owner.get(k)
          if (e && taken.has(k)) homes.add(e)
        }
      }
      // Several unflagged entries (e.g. "...Butter" and "...Butter Extract"): the base, shortest name. Never guess
      // when a flagged entry is among them.
      if (homes.size === 0 || (homes.size > 1 && [...homes].some((e) => e.listings.length > 0))) continue
      const [home] = [...homes].sort((x, y) => x.name.length - y.name.length || (x.id < y.id ? -1 : 1))
      for (const name of g.commonNames) {
        const k = normalizeName(name)
        if (taken.has(k) || !usableCommonName(k)) continue
        if (!proposals.has(k)) proposals.set(k, new Set())
        proposals.get(k)!.add(home)
      }
    }
    for (const [k, homes] of proposals) {
      // Two different substances in this source claim the same everyday name: neither gets it.
      if (homes.size !== 1) continue
      const [home] = homes
      home.aliases.push(k)
      taken.add(k)
    }
  }
  for (const e of entries) e.aliases.sort()
}
