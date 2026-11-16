import type { CommonNameGroup, Row } from './types'

// data/overrides/aliases.csv: hand-checked label words (e.g. US "Fragrance" for EU "Parfum"). Ranked above
// every downloaded name source, still below official names, and subject to the same clash rules.
export function parseAliasOverrides(rows: Row[]): CommonNameGroup[] {
  return rows
    .map((r) => ({ name: (r.name ?? '').trim(), alias: (r.alias ?? '').trim() }))
    .filter((r) => r.name && r.alias)
    .map((r) => ({ joinNames: [r.name], commonNames: [r.alias] }))
}
