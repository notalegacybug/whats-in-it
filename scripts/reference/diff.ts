import type { Reference } from '../../src/reference/types'

export interface ReferenceDiff {
  added: string[]
  removed: string[]
  changed: string[]
}

/** JSON with object keys sorted, so two entries with the same content but different key order compare equal. */
const canonical = (value: unknown): string =>
  JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : v,
  )

/** Entry ids added, removed, or present in both with different content. `builtAt` and `version` are not compared. */
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

/**
 * Saved products record the reference version they were checked against, so content must never change
 * under an old version number. Returns the reason to stop the build, or null when it may go ahead.
 */
export function versionBumpProblem(prevVersion: string | null, nextVersion: string, diff: ReferenceDiff): string | null {
  const changed = diff.added.length + diff.removed.length + diff.changed.length > 0
  if (prevVersion === null || !changed || prevVersion !== nextVersion) return null
  return `Reference content changed but data/version.json was not bumped (still ${nextVersion}). Bump it and rebuild.`
}
