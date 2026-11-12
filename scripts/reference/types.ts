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

/** One ordinary ingredient as an inventory (CosIng, FDA, E numbers) lists it. Never carries a hazard listing. */
export interface CatalogueRecord {
  name: string
  /** Other names for the same substance, as the source wrote them (the merge step normalises them). */
  aliases: string[]
  /** Valid CAS numbers only; may be empty. */
  cas: string[]
  /** What the ingredient does, lower case, e.g. "humectant"; '' when the source gives none. */
  functionNote: string
  /** True only when CosIng's restriction cell says the substance is banned in EU cosmetics (Annex II). */
  euCosmeticsBanned: boolean
}

/** Hand-written notes, keyed by entry id. */
export type NotesFile = Record<string, { note: string; caveat?: string }>
