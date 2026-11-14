// Builds data/sources/gsrs-names.csv from FDA's GSRS UNII names file (public US government data).
// The full file is ~80 MB, so only substances that share a name with our ingredient sources are kept.
// The download and extracted text stay in data/sources/original/ (git-ignored).
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Papa from 'papaparse'

const URL_NAMES = 'https://precision.fda.gov/uniisearch/archive/latest/UNIIs.zip'
const ORIGINAL = new URL('../data/sources/original/gsrs/', import.meta.url)
const SOURCES = new URL('../data/sources/', import.meta.url)
const OUT = new URL('gsrs-names.csv', SOURCES)
const KEEP_TYPES = new Set(['of', 'cn', 'sys'])
const MAX_NAME_LENGTH = 120 // longer names are chemical formulas, never label names

// Loose on purpose: a superset filter; the reference build does the exact matching.
const loose = (s) =>
  s
    .toLowerCase()
    .replace(/\s*\[[^\]]*\]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
const looseVariants = (s) => [loose(s), loose(s.replace(/\([^)]*\)/g, ' '))]

mkdirSync(ORIGINAL, { recursive: true })
const zip = new URL('UNIIs.zip', ORIGINAL)
if (!existsSync(zip)) {
  const res = await fetch(URL_NAMES)
  if (!res.ok) throw new Error(`GSRS download failed: ${res.status}`)
  writeFileSync(zip, Buffer.from(await res.arrayBuffer()))
}
// Windows' own tar.exe reads zip files (Git Bash's GNU tar does not); elsewhere use unzip.
const dir = fileURLToPath(ORIGINAL)
const windowsTar = join(process.env.SystemRoot ?? 'C:/Windows', 'System32', 'tar.exe')
if (process.platform === 'win32') execFileSync(windowsTar, ['-xf', 'UNIIs.zip'], { cwd: dir })
else execFileSync('unzip', ['-o', '-q', 'UNIIs.zip'], { cwd: dir })
const namesFile = readdirSync(ORIGINAL).find((f) => /^UNII_Names_.*\.txt$/.test(f))
if (!namesFile) throw new Error('No UNII_Names_*.txt in the GSRS download')

const ours = new Set()
for (const [file, column] of [['cosing.csv', 'INCI name'], ['fda-saf.csv', 'Substance'], ['ntp.csv', 'Name']]) {
  const path = new URL(file, SOURCES)
  if (!existsSync(path)) continue
  const { data } = Papa.parse(readFileSync(path, 'utf8'), { header: true, skipEmptyLines: true })
  for (const row of data) if (row[column]) for (const v of looseVariants(row[column])) ours.add(v)
}

const rows = []
const byUnii = new Map()
for (const line of readFileSync(new URL(namesFile, ORIGINAL), 'utf8').split('\n').slice(1)) {
  const [name, type, unii] = line.replace(/\r$/, '').split('\t')
  if (!name || !unii || !KEEP_TYPES.has(type) || name.length > MAX_NAME_LENGTH) continue
  if (!byUnii.has(unii)) byUnii.set(unii, [])
  byUnii.get(unii).push([unii, name, type])
}
for (const names of byUnii.values()) {
  if (names.some(([, name]) => looseVariants(name).some((v) => ours.has(v)))) rows.push(...names)
}
writeFileSync(OUT, Papa.unparse({ fields: ['UNII', 'Name', 'Type'], data: rows }) + '\n', 'utf8')
console.log(`${namesFile}: kept ${rows.length} names for ${new Set(rows.map((r) => r[0])).size} substances -> data/sources/gsrs-names.csv`)
