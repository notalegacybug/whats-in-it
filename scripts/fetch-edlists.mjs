// Builds data/sources/edlists.csv from the EU Endocrine Disruptor Lists (https://edlists.org), run by
// national authorities of several EU countries. The site's Excel export refuses scripted requests, so this
// reads the same table from each list's web page. Pages are kept in data/sources/original/edlists/.
import { mkdirSync, writeFileSync } from 'node:fs'
import Papa from 'papaparse'

const PAGES = {
  'List I': 'https://edlists.org/the-ed-lists/list-i-substances-identified-as-endocrine-disruptors-by-the-eu',
  'List II': 'https://edlists.org/the-ed-lists/list-ii-substances-under-eu-investigation-endocrine-disruption',
  'List III':
    'https://edlists.org/the-ed-lists/list-iii-substances-identified-as-endocrine-disruptors-by-participating-national-authorities',
}
const ORIGINAL = new URL('../data/sources/original/edlists/', import.meta.url)
const OUT = new URL('../data/sources/edlists.csv', import.meta.url)
const FIELDS = ['Name', 'CAS', 'EC', 'Health effects', 'Environmental effects', 'Status', 'Year', 'Regulatory field', 'List']

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#039': "'", nbsp: ' ', plusmn: '±' }
const text = (cell) =>
  cell
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) =>
      e[0] === '#' ? String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1))) : (ENTITIES[e] ?? m),
    )
    .replace(/\s+/g, ' ')
    .trim()

mkdirSync(ORIGINAL, { recursive: true })
const rows = []
for (const [list, url] of Object.entries(PAGES)) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) throw new Error(`${list}: ${res.status} for ${url}`)
  const page = await res.text()
  writeFileSync(new URL(`${list.replace(' ', '-').toLowerCase()}.html`, ORIGINAL), page)
  if (/class="[^"]*pager/.test(page)) throw new Error(`${list}: the page is now split into pages; this script reads one page only`)
  const table = page.slice(page.indexOf('<table'), page.indexOf('</table>'))
  const before = rows.length
  for (const tr of table.match(/<tr[^>]*>.*?<\/tr>/gs) ?? []) {
    const cells = [...tr.matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map((m) => text(m[1]))
    if (cells.length < 8) continue
    // The last column says which lists the substance is on; this page's own list is what the row belongs to.
    rows.push([...cells.slice(0, 8), list])
  }
  if (rows.length === before) throw new Error(`${list}: no table rows found; the page layout may have changed`)
  console.log(`${list}: ${rows.length - before} rows`)
}
writeFileSync(OUT, Papa.unparse({ fields: FIELDS, data: rows }) + '\n', 'utf8')
console.log(`Wrote ${rows.length} rows to data/sources/edlists.csv`)
