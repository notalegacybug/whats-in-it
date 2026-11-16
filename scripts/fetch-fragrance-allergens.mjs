// Builds data/sources/eu-fragrance-allergens.csv from CosIng (CC BY 4.0): the Annex III substances that must be
// named on the label above 0.001% in leave-on / 0.01% in rinse-off products, which is the EU fragrance-allergen rule.
import { writeFileSync } from 'node:fs'
import Papa from 'papaparse'

const API = 'https://webgate.ec.europa.eu/es/search-api/rest/search'
const KEY = '285a77fd-1257-4271-8507-f0c6b2961203' // public key from the CosIng website's own config
const OUT = new URL('../data/sources/eu-fragrance-allergens.csv', import.meta.url)
const LABEL_RULE = /indicated\s+(?:as\s+\S+\s+)?in the list of ingredients/i
const ALLERGEN_LIMIT = /0[.,]001\s*%/

async function page(n) {
  const form = new FormData()
  form.append('query', new Blob([JSON.stringify({ bool: { must: [{ terms: { itemType: ['substance'] } }, { terms: { annexNo: ['III'] } }] } })], { type: 'application/json' }))
  const res = await fetch(`${API}?apiKey=${KEY}&text=*&pageSize=200&pageNumber=${n}`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`CosIng API ${res.status}`)
  return res.json()
}

// Paging order is not stable, so read until every record is seen (by reference) or give up.
const records = new Map()
let total = 0
for (let attempt = 0; attempt < 6 && (total === 0 || records.size < total); attempt++) {
  for (let n = 1; ; n++) {
    const r = await page(n)
    total = r.totalResults
    for (const x of r.results) records.set(x.reference, x.metadata)
    if (n * 200 >= total) break
  }
}
if (records.size !== total) throw new Error(`Read ${records.size} of ${total} Annex III entries; not writing.`)

const first = (v) => (Array.isArray(v) ? (v[0] ?? '') : (v ?? ''))
const rows = []
for (const m of records.values()) {
  const rule = [m.other, m.wordingOfConditions, m.otherRestrictions].flat().filter(Boolean).join(' ')
  if (!LABEL_RULE.test(rule) || !ALLERGEN_LIMIT.test(rule)) continue
  rows.push({
    Name: first(m.nameOfCommonIngredientsGlossary) || first(m.inciName),
    'Chemical name': first(m.inciName),
    CAS: (m.casNo ?? []).join(' / '),
    'Annex III ref': first(m.refNo),
  })
}
rows.sort((a, b) => Number(a['Annex III ref']) - Number(b['Annex III ref']) || a.Name.localeCompare(b.Name))
writeFileSync(OUT, Papa.unparse(rows) + '\n', 'utf8')
console.log(`${total} Annex III entries; ${rows.length} fragrance allergens -> data/sources/eu-fragrance-allergens.csv`)
