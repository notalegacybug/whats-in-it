export type SourceId = 'IARC' | 'NTP' | 'PROP65' | 'EU_CLP'
export type Level = 'strong' | 'possible'
export type Verdict = 'watch_strong' | 'watch_possible' | 'no_known_concern' | 'not_recognised'

export interface Listing {
  source: SourceId
  classification: string
  level: Level
  year: number | null
  url: string
  qualifier?: string
}

export interface RefEntry {
  id: string // "cas:50-00-0" or "name:<normalised name>"
  name: string
  aliases: string[]
  cas: string[]
  listings: Listing[] // empty for ordinary catalogue entries
  note?: string // hand-checked note
  functionNote?: string // inventory function, e.g. "humectant"
  caveat?: string
  euCosmeticsBanned?: boolean
}

export interface Reference {
  version: string
  builtAt: string
  entries: RefEntry[]
}

export interface Match {
  key: string
  verdict: Verdict
  entry: RefEntry | null
}

export interface IngredientResult {
  input: string
  verdict: Verdict
  matches: Match[]
}
