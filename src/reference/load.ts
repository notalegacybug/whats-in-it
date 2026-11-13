import { buildIndex } from './index'
import type { RefIndex } from './index'
import type { Reference } from './types'

// Memoise the in-flight promise (not the result) so concurrent callers share one fetch.
let memo: Promise<RefIndex> | null = null
// Fingerprint (ETag) of the file in use, so a refresh can skip parsing an unchanged 6 MB file.
let lastEtag: string | null = null

async function fetchIndex(fetchFn: typeof fetch): Promise<RefIndex> {
  const res = await fetchFn('/reference.json')
  if (!res.ok) throw new Error(`Reference request failed (${res.status})`)
  lastEtag = res.headers?.get('etag') ?? null
  return parse(res)
}

async function parse(res: Response): Promise<RefIndex> {
  const data = (await res.json()) as Partial<Reference> | null
  if (!data || typeof data.version !== 'string' || !Array.isArray(data.entries)) {
    throw new Error('Reference file is malformed')
  }
  return buildIndex(data as Reference)
}

// A failed attempt is forgotten so the next call retries.
export function loadReference(fetchFn: typeof fetch = fetch): Promise<RefIndex> {
  if (!memo) {
    const attempt = fetchIndex(fetchFn)
    memo = attempt
    attempt.catch(() => {
      if (memo === attempt) memo = null
    })
  }
  return memo
}

// Re-checks the server (a cheap "not modified" when unchanged). Returns the new index only if the file changed;
// null when unchanged, offline or failing, so callers keep what they have.
export async function refreshReference(fetchFn: typeof fetch = fetch): Promise<RefIndex | null> {
  try {
    const res = await fetchFn('/reference.json', { cache: 'no-cache' })
    if (!res.ok) return null
    const etag = res.headers?.get('etag') ?? null
    if (etag && etag === lastEtag) return null
    const index = await parse(res)
    lastEtag = etag
    memo = Promise.resolve(index)
    return index
  } catch {
    return null
  }
}

export function resetReferenceForTests(): void {
  lastEtag = null
  memo = null
}
