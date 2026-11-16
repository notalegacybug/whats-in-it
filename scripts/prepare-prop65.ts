// Usage: npx tsx scripts/prepare-prop65.ts [downloaded file]
// Reads OEHHA's list (default data/sources/original/p65chemicalslist.csv) and writes data/sources/prop65.csv.
import { readFileSync, writeFileSync } from 'node:fs'
import Papa from 'papaparse'
import { prepareProp65 } from './reference/prop65Prepare'

const input = process.argv[2] ?? new URL('../data/sources/original/p65chemicalslist.csv', import.meta.url)
const raw = Papa.parse<string[]>(readFileSync(input, 'utf8').replace(/^﻿/, ''), { skipEmptyLines: true }).data
const rows = prepareProp65(raw)
const title = raw.find((r) => /^\d{1,2}-[A-Za-z]{3}-\d{2}$/.test((r[0] ?? '').trim()))?.[0]
writeFileSync(new URL('../data/sources/prop65.csv', import.meta.url), Papa.unparse(rows) + '\n', 'utf8')
console.log(`List dated ${title ?? '(no date row found)'}: wrote ${rows.length} rows to data/sources/prop65.csv`)
