import type { Listing } from '../../src/reference/types'

export type { Listing }

/** One substance as one source lists it. The build step merges these across sources. */
export interface SourceRecord {
  name: string
  /** Valid CAS numbers only; may be empty (the merge step decides what to do with those). */
  cas: string[]
  listing: Listing
}

/** A parsed CSV row keyed by header. Adapters must tolerate any key being absent. */
export type Row = Record<string, string>
