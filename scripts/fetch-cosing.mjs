// Collects the EU CosIng ingredient inventory into data/sources/cosing.csv.
// CosIng has no bulk download; this calls the same public search API its website uses (key from the site's
// own public config). Content is CC BY 4.0 (https://commission.europa.eu/legal-notice_en).
// The API returns at most 10,000 rows per query and ignores range filters on most docs, so queries filter on
// exact substanceId batches; IDs above MAX_ID would be missed, which the final count check catches.
import { writeFileSync } from 'node:fs'

const API = 'https://webgate.ec.europa.eu/es/search-api/rest/search'
const KEY = '285a77fd-1257-4271-8507-f0c6b2961203'
const OUT = new URL('../data/sources/cosing.csv', import.meta.url)
const BATCH = 5000
const SUB = 100 // ids per one-page query; an id can hold more than one ingredient
const MAX_ID = 300000
const PAGE = 200 // the API silently caps pages at 200 rows
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function search(ids, pageSize, pageNumber) {
  const query = { bool: { must: [{ terms: { itemType: ['ingredient'] } }, { terms: { substanceId: ids } }] } }
  if (!ids) query.bool.must.pop()
  const form = new FormData()
  form.append('query', new Blob([JSON.stringify(query)], { type: 'application/json' }))
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${API}?apiKey=${KEY}&text=*&pageSize=${pageSize}&pageNumber=${pageNumber}`, { method: 'POST', body: form })
    if (res.ok) return res.json()
    if (attempt === 4) throw new Error(`CosIng API ${res.status} for IDs ${ids?.[0]}.. page ${pageNumber}`)
    await sleep(2000 * attempt)
  }
}

const first = (v) => (Array.isArray(v) ? v[0] ?? '' : v ?? '')
const csvCell = (s) => (/[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s)

const { totalResults: expected } = await search(null, 1, 1)
const rows = new Map()
for (let start = 0; start < MAX_ID; start += BATCH) {
  const ids = Array.from({ length: BATCH }, (_, i) => String(start + i))
  const { totalResults: total } = await search(ids, 1, 1)
  await sleep(300)
  if (!total) continue
  // Paging order is not stable, so each sub-batch must fit in one page.
  for (let sub = start; sub < start + BATCH; sub += SUB) {
    const subIds = ids.slice(sub - start, sub - start + SUB)
    const { totalResults: n, results } = await search(subIds, PAGE, 1)
    if (results.length !== n) throw new Error(`IDs ${sub}..: got ${results.length} of ${n}`)
    for (const { reference, metadata: m } of results) {
      rows.set(reference, [
        first(m.inciName),
        first(m.casNo),
        (m.functionName ?? []).join(', '),
        (m.cosmeticRestriction ?? []).join('; '),
        first(m.status),
      ])
    }
    process.stdout.write(`\r${rows.size} / ${expected}`)
    await sleep(500)
  }
}
console.log()
if (rows.size !== expected) throw new Error(`Collected ${rows.size} ingredients but the API reports ${expected}; not writing.`)
const header = ['INCI name', 'CAS No', 'Function', 'Restriction', 'Status']
const lines = [header, ...[...rows.values()].sort((a, b) => a[0].localeCompare(b[0]))].map((r) => r.map(csvCell).join(','))
writeFileSync(OUT, lines.join('\n') + '\n', 'utf8')
console.log(`Wrote ${rows.size} ingredients to data/sources/cosing.csv`)
