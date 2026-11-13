import { normalizeName } from '../../src/ingredients/normalize'
import type { Reference } from '../../src/reference/types'

/**
 * Keys that more than one entry answers to. Keys are built exactly as `buildIndex` in
 * src/reference/index.ts builds them (normalised name, normalised aliases, CAS numbers); there the first
 * entry silently wins a contested key, so a listed entry could be shadowed by an unlisted one.
 */
export function findKeyCollisions(ref: Reference): { key: string; ids: string[] }[] {
  const owners = new Map<string, Set<string>>()
  for (const entry of ref.entries) {
    for (const key of [entry.name, ...entry.aliases].map(normalizeName).concat(entry.cas)) {
      if (!key) continue
      if (!owners.has(key)) owners.set(key, new Set())
      owners.get(key)!.add(entry.id)
    }
  }
  return [...owners]
    .filter(([, ids]) => ids.size > 1)
    .map(([key, ids]) => ({ key, ids: [...ids].sort() }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
}
