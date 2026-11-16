export type SourceId = 'IARC' | 'NTP' | 'PROP65' | 'EU_CLP' | 'ED_LISTS'
/** What a list is about. Cancer is always checked; hormone disruption is a check the person turns on. */
export type Hazard = 'cancer' | 'hormone'
export type Level = 'strong' | 'possible'
export type Verdict = 'watch_strong' | 'watch_possible' | 'no_known_concern' | 'not_recognised'

export interface Listing {
  source: SourceId
  /** Absent means cancer. */
  hazard?: Hazard
  classification: string
  level: Level
  year: number | null
  url: string
  qualifier?: string
  /** Which edition of the list, from data/sources/config.json; shown when there is no year. */
  edition?: string
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
  sources?: SourceId[]
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
