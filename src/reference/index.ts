import { normalizeName } from '../ingredients/normalize'
import type { RefEntry, Reference, SourceId } from './types'

export interface RefIndex {
  version: string
  /** Hazard lists this reference was built from; ingredients on any other list are not flagged. */
  sources: SourceId[]
  byKey: Map<string, RefEntry>
  keys: string[]
}

// First entry wins a contested key.
export function buildIndex(ref: Reference): RefIndex {
  const byKey = new Map<string, RefEntry>()
  for (const entry of ref.entries) {
    const keys = [entry.name, ...entry.aliases].map(normalizeName).concat(entry.cas)
    for (const key of keys) {
      if (key && !byKey.has(key)) byKey.set(key, entry)
    }
  }
  return { version: ref.version, sources: ref.sources ?? [], byKey, keys: [...byKey.keys()] }
}
