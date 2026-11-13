import { buildIndex } from './index'
import type { RefIndex } from './index'
import type { Reference } from './types'

// Memoise the in-flight promise (not the result) so concurrent callers share one fetch.
let memo: Promise<RefIndex> | null = null

async function fetchIndex(fetchFn: typeof fetch): Promise<RefIndex> {
  const res = await fetchFn('/reference.json')
  if (!res.ok) throw new Error(`Reference request failed (${res.status})`)
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

export function resetReferenceForTests(): void {
  memo = null
}
