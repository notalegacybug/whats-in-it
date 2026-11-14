import type { CommonNameGroup, Row } from '../types'
import { cell } from '../util'

// Written by scripts/fetch-gsrs.mjs from FDA's UNII names file.
export const COLUMNS = { unii: 'UNII', name: 'Name', type: 'Type' } as const

// "COCONUT OIL [MI]": the bracket names the publication, not the substance.
const SOURCE_TAG = /\s*\[[^\]]*\]\s*$/
const strip = (name: string) => {
  let s = name
  while (SOURCE_TAG.test(s)) s = s.replace(SOURCE_TAG, '')
  return s.trim()
}

// of = official, cn = common, sys = systematic (used only to find the substance), cd/bn = codes/brands (ignored).
export function parseGsrs(rows: Row[]): CommonNameGroup[] {
  const groups = new Map<string, CommonNameGroup>()
  for (const row of rows) {
    const unii = cell(row, COLUMNS.unii)
    const type = cell(row, COLUMNS.type)
    const name = strip(cell(row, COLUMNS.name))
    if (!unii || !name || !['of', 'cn', 'sys'].includes(type)) continue
    let g = groups.get(unii)
    if (!g) groups.set(unii, (g = { joinNames: [], commonNames: [] }))
    if (!g.joinNames.includes(name)) g.joinNames.push(name)
    if (type !== 'sys' && !g.commonNames.includes(name)) g.commonNames.push(name)
  }
  return [...groups.values()]
}
