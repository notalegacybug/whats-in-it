import type { Listing } from '../../src/reference/types'

export type { Listing }

export interface SourceRecord {
  name: string
  cas: string[]
  listing: Listing
}

// Adapters must tolerate any key being absent.
export type Row = Record<string, string>

// Never carries a hazard listing.
export interface CatalogueRecord {
  name: string
  aliases: string[]
  cas: string[]
  functionNote: string
  // Annex II only.
  euCosmeticsBanned: boolean
  // Context only, never a hazard listing.
  regulatoryNote?: string
}

export type NotesFile = Record<string, { note: string; caveat?: string }>

// One substance in a name-only source (e.g. FDA GSRS): names that identify it, and everyday names to add.
export interface CommonNameGroup {
  joinNames: string[]
  commonNames: string[]
}
