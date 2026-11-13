import type { Reference } from '../../src/reference/types'

export interface ReferenceDiff {
  added: string[]
  removed: string[]
  changed: string[]
}

// Sorted keys, so entries differing only in key order compare equal.
const canonical = (value: unknown): string =>
  JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : v,
  )

export function diffReferences(prev: Reference | null, next: Reference): ReferenceDiff {
  const before = new Map((prev?.entries ?? []).map((e) => [e.id, canonical(e)]))
  const after = new Map(next.entries.map((e) => [e.id, canonical(e)]))
  const sorted = (ids: string[]) => ids.sort()
  return {
    added: sorted([...after.keys()].filter((id) => !before.has(id))),
    removed: sorted([...before.keys()].filter((id) => !after.has(id))),
    changed: sorted([...after].filter(([id, json]) => before.has(id) && before.get(id) !== json).map(([id]) => id)),
  }
}

// Saved products record the reference version, so content must never change under an old one.
export function versionBumpProblem(prevVersion: string | null, nextVersion: string, diff: ReferenceDiff): string | null {
  const changed = diff.added.length + diff.removed.length + diff.changed.length > 0
  if (prevVersion === null || !changed || prevVersion !== nextVersion) return null
  return `Reference content changed but data/version.json was not bumped (still ${nextVersion}). Bump it and rebuild.`
}
