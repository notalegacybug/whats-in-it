import { normalizeName } from '../ingredients/normalize'
import type { RefEntry, Reference } from './types'

export interface RefIndex {
  version: string
  byKey: Map<string, RefEntry>
  keys: string[]
}

/** Index entries by normalised name, aliases and CAS numbers. First entry wins a contested key. */
export function buildIndex(ref: Reference): RefIndex {
  const byKey = new Map<string, RefEntry>()
  for (const entry of ref.entries) {
    const keys = [entry.name, ...entry.aliases].map(normalizeName).concat(entry.cas)
    for (const key of keys) {
      if (key && !byKey.has(key)) byKey.set(key, entry)
    }
  }
  return { version: ref.version, byKey, keys: [...byKey.keys()] }
}
