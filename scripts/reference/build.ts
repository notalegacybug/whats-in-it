// Builds public/reference.json. All file I/O lives here; merge.ts and diff.ts stay pure.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'
import type { Reference, SourceId } from '../../src/reference/types'
import { normalizeName } from '../../src/ingredients/normalize'
import { COLUMNS as COSING_COLUMNS, parseCosing } from './adapters/cosing'
import { COLUMNS as ED_LISTS_COLUMNS, parseEdLists } from './adapters/edLists'
import { COLUMNS as ENUMBERS_COLUMNS, parseENumbers } from './adapters/eNumbers'
import { COLUMNS as EU_CLP_COLUMNS, parseEuClp } from './adapters/euClp'
import { COLUMNS as FDA_COLUMNS, parseFda } from './adapters/fda'
import { COLUMNS as ALLERGEN_COLUMNS, parseFragranceAllergens } from './adapters/fragranceAllergens'
import { COLUMNS as GSRS_COLUMNS, parseGsrs } from './adapters/gsrs'
import { COLUMNS as IARC_COLUMNS, parseIarc } from './adapters/iarc'
import { COLUMNS as NTP_COLUMNS, parseNtp } from './adapters/ntp'
import { COLUMNS as PROP65_COLUMNS, parseProp65 } from './adapters/prop65'
import { findKeyCollisions } from './collisions'
import { diffReferences, versionBumpProblem } from './diff'
import { checkSourceFile } from './guard'
import { mergeReference } from './merge'
import { withEdition } from './util'
import { checkNotes } from './notesCheck'
import { parseAliasOverrides } from './overrides'
import type { CatalogueRecord, CommonNameGroup, FragranceAllergen, NotesFile, Row, SourceRecord } from './types'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const path = (...parts: string[]) => join(ROOT, ...parts)

const args = new Set(process.argv.slice(2))
const allowMissingNotes = args.has('--allow-missing-notes')
const allowMissingSources = args.has('--allow-missing-sources')

interface Config {
  exclude: SourceId[]
  euClpAnnexYear: number | null
  // Shown when a listing has no year.
  editions: Partial<Record<SourceId, string>>
}

interface Source<T> {
  label: string
  file: string
  columns: Readonly<Record<string, string>>
  parse: (rows: Row[], config: Config) => T[]
}

const HAZARD_IDS: SourceId[] = ['IARC', 'NTP', 'PROP65', 'EU_CLP', 'ED_LISTS']

const hazardSources: (Source<SourceRecord> & { id: SourceId })[] = [
  { id: 'IARC', label: 'IARC', file: 'iarc.csv', columns: IARC_COLUMNS, parse: parseIarc },
  { id: 'NTP', label: 'NTP', file: 'ntp.csv', columns: NTP_COLUMNS, parse: parseNtp },
  { id: 'PROP65', label: 'PROP65', file: 'prop65.csv', columns: PROP65_COLUMNS, parse: parseProp65 },
  {
    id: 'EU_CLP',
    label: 'EU_CLP',
    file: 'eu-clp.csv',
    columns: EU_CLP_COLUMNS,
    parse: (rows, config) => parseEuClp(rows, config.euClpAnnexYear as number),
  },
  { id: 'ED_LISTS', label: 'ED_LISTS', file: 'edlists.csv', columns: ED_LISTS_COLUMNS, parse: parseEdLists },
]

const catalogueSources: Source<CatalogueRecord>[] = [
  { label: 'cosing', file: 'cosing.csv', columns: COSING_COLUMNS, parse: parseCosing },
  { label: 'fda-saf', file: 'fda-saf.csv', columns: FDA_COLUMNS, parse: parseFda },
  { label: 'e-numbers', file: 'e-numbers.csv', columns: ENUMBERS_COLUMNS, parse: parseENumbers },
]

// Name-only sources, highest rank first. Official names from the sources above always outrank these.
const nameSources: Source<CommonNameGroup>[] = [
  { label: 'gsrs', file: 'gsrs-names.csv', columns: GSRS_COLUMNS, parse: parseGsrs },
]

const allergenSource: Source<FragranceAllergen> = {
  label: 'allergens',
  file: 'eu-fragrance-allergens.csv',
  columns: ALLERGEN_COLUMNS,
  parse: parseFragranceAllergens,
}

const problems: string[] = []
const summary: string[] = []

function readCsv(file: string): { headers: string[]; rows: Row[] } {
  const text = readFileSync(file, 'utf8').replace(/^﻿/, '')
  const parsed = Papa.parse<Row>(text, { header: true, skipEmptyLines: true, delimiter: ',' })
  if (parsed.errors.length) {
    const e = parsed.errors[0]
    throw new Error(`${file}: CSV error "${e.message}" at row ${e.row ?? '?'} (${parsed.errors.length} in total)`)
  }
  return { headers: parsed.meta.fields ?? [], rows: parsed.data }
}

// Failures go to `problems`; the build stops only after all are collected.
function load<T>(s: Source<T>, excluded: boolean, config: Config): T[] | null {
  const file = path('data', 'sources', s.file)
  const name = s.label.padEnd(10)
  if (excluded) {
    summary.push(`  ${name} excluded by config`)
    return null
  }
  if (!existsSync(file)) {
    summary.push(`  ${name} MISSING (skipped)`)
    const message = `${s.label}: data/sources/${s.file} is missing.`
    if (allowMissingSources) console.warn(`WARNING: ${message} Skipped because of --allow-missing-sources.`)
    else problems.push(`${message} Add the file, exclude the source in data/sources/config.json, or pass --allow-missing-sources.`)
    return null
  }
  if (s.label === 'EU_CLP' && typeof config.euClpAnnexYear !== 'number') {
    problems.push('EU_CLP: data/sources/eu-clp.csv is present but euClpAnnexYear in data/sources/config.json is not a number. Set it to the year of the Annex VI edition.')
    return null
  }
  try {
    const { headers, rows } = readCsv(file)
    const records = s.parse(rows, config)
    checkSourceFile(s.label, s.file, headers, s.columns, records.length)
    summary.push(`  ${name} included (${records.length} records)`)
    return records
  } catch (error) {
    summary.push(`  ${name} FAILED`)
    problems.push(error instanceof Error ? error.message : String(error))
    return null
  }
}

function readJson<T>(file: string): T {
  try {
    return JSON.parse(readFileSync(file, 'utf8')) as T
  } catch (error) {
    throw new Error(`${file}: cannot read as JSON (${error instanceof Error ? error.message : String(error)})`)
  }
}

function loadConfig(): Config {
  const config = readJson<Partial<Config>>(path('data', 'sources', 'config.json'))
  if (!Array.isArray(config.exclude) || config.exclude.some((id) => !HAZARD_IDS.includes(id))) {
    throw new Error(`data/sources/config.json: "exclude" must be a list of ${HAZARD_IDS.join(', ')}; got ${JSON.stringify(config.exclude)}`)
  }
  const year = config.euClpAnnexYear ?? null
  if (year !== null && !Number.isInteger(year)) throw new Error('data/sources/config.json: "euClpAnnexYear" must be a whole number or null')
  const editions = config.editions ?? {}
  const badEdition = Object.entries(editions).find(
    ([id, text]) => !HAZARD_IDS.includes(id as SourceId) || typeof text !== 'string' || !text.trim(),
  )
  if (typeof editions !== 'object' || Array.isArray(editions) || badEdition) {
    throw new Error(`data/sources/config.json: "editions" must map ${HAZARD_IDS.join(', ')} to non-empty text; got ${JSON.stringify(config.editions)}`)
  }
  return { exclude: config.exclude, euClpAnnexYear: year, editions }
}

function loadCaslessAllow(): Set<string> {
  const file = path('data', 'overrides', 'casless-allow.csv')
  if (!existsSync(file)) {
    problems.push('data/overrides/casless-allow.csv is missing (header `name`, no rows needed).')
    return new Set()
  }
  const { headers, rows } = readCsv(file)
  if (!headers.includes('name')) problems.push('data/overrides/casless-allow.csv needs a header named "name".')
  return new Set(rows.map((r) => normalizeName(r.name ?? '')).filter(Boolean))
}

function previousReference(): Reference | null {
  const file = path('public', 'reference.json')
  return existsSync(file) ? readJson<Reference>(file) : null
}

function main(): number {
  const config = loadConfig()
  const flagged: SourceRecord[] = []
  const included: SourceId[] = []
  for (const s of hazardSources) {
    const records = load(s, config.exclude.includes(s.id), config)
    if (records) {
      flagged.push(...withEdition(records, config.editions[s.id]))
      included.push(s.id)
    }
  }
  const catalogue: CatalogueRecord[] = []
  for (const s of catalogueSources) catalogue.push(...(load(s, false, config) ?? []))
  const overridesFile = path('data', 'overrides', 'aliases.csv')
  const aliasOverrides = existsSync(overridesFile) ? parseAliasOverrides(readCsv(overridesFile).rows) : []
  const fragranceAllergens = load(allergenSource, false, config) ?? []
  const commonNames = [aliasOverrides, ...nameSources.map((s) => load(s, false, config) ?? [])]

  const caslessAllow = loadCaslessAllow()
  const notes = readJson<NotesFile>(path('data', 'notes', 'notes.json'))
  const { version } = readJson<{ version: string }>(path('data', 'version.json'))

  console.log('Sources:')
  console.log(summary.join('\n'))
  if (problems.length) {
    console.error(`\nBuild stopped, nothing written:\n${problems.map((p) => `  - ${p}`).join('\n')}`)
    return 1
  }

  const { reference: merged, missingNotes } = mergeReference({
    flagged,
    catalogue,
    notes,
    caslessAllow,
    commonNames,
    fragranceAllergens,
    version,
    builtAt: new Date().toISOString(),
  })
  const reference: Reference = { version: merged.version, builtAt: merged.builtAt, sources: included, entries: merged.entries }

  const collisions = findKeyCollisions(reference)
  if (collisions.length) {
    const shown = collisions.slice(0, 20).map((c) => `  - "${c.key}": ${c.ids.join(', ')}`)
    const more = collisions.length > 20 ? `\n  ... and ${collisions.length - 20} more` : ''
    console.error(
      `\nBuild stopped, nothing written: ${collisions.length} name/alias/CAS key(s) belong to more than one entry, ` +
        `so the app would let the first one hide the rest:\n${shown.join('\n')}${more}`,
    )
    return 1
  }

  const noteProblems = checkNotes(notes, new Set(reference.entries.map((e) => e.id)))
  if (noteProblems.length) {
    console.error(`\nBuild stopped, nothing written: data/notes/notes.json breaks the note rules:\n${noteProblems.map((p) => `  - ${p}`).join('\n')}`)
    return 1
  }

  const previous = previousReference()
  const diff = diffReferences(previous, reference)
  const bumpProblem = versionBumpProblem(previous?.version ?? null, reference.version, diff)
  if (bumpProblem) {
    console.error(`\nBuild stopped, nothing written: ${bumpProblem}`)
    console.error(`  (${diff.added.length} added, ${diff.removed.length} removed, ${diff.changed.length} changed)`)
    return 1
  }
  const listed = reference.entries.filter((e) => e.listings.length > 0)
  const perSource = included.map((id) => `${id} ${listed.filter((e) => e.listings.some((l) => l.source === id)).length}`)

  mkdirSync(path('public'), { recursive: true })
  writeFileSync(path('public', 'reference.json'), JSON.stringify(reference))
  mkdirSync(path('data', 'notes'), { recursive: true })
  writeFileSync(path('data', 'notes', 'missing.json'), JSON.stringify(missingNotes, null, 2) + '\n')

  console.log(`\nversion ${reference.version}, sources: ${included.join(', ') || '(none)'}`)
  console.log(`Entries: ${reference.entries.length} total, ${listed.length} listed (listed entries per source: ${perSource.join(', ') || '-'})`)
  console.log(`Changes since the previous public/reference.json: ${diff.added.length} added, ${diff.removed.length} removed, ${diff.changed.length} changed`)
  for (const [label, ids] of [['added', diff.added], ['removed', diff.removed], ['changed', diff.changed]] as const) {
    if (ids.length && ids.length <= 20) console.log(`  ${label}: ${ids.join(', ')}`)
  }
  console.log(`Entries needing a note: ${missingNotes.length} (listed in data/notes/missing.json)`)

  if (missingNotes.length && !allowMissingNotes) {
    console.error('Exiting with 1: some listed entries have no hand-checked note. Add them to data/notes/notes.json or pass --allow-missing-notes.')
    return 1
  }
  return 0
}

try {
  process.exitCode = main()
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
}
