import type { NotesFile } from './types'

export const MAX_WORDS = 30

/**
 * Matched as whole words, any case. The first group makes a health claim the listings themselves must carry;
 * the second reassures or minimises ("small amounts", "natural"), which next to a listing reads as "nothing to worry about".
 * Notes stay descriptive: what the substance is and where it comes from.
 */
export const BANNED_TERMS = [
  'safe',
  'unsafe',
  'dangerous',
  'toxic',
  'toxicity',
  'harmful',
  'causes cancer',
  'cancer-causing',
  'carcinogen',
  'carcinogens',
  'carcinogenic',
  'small amounts',
  'trace amounts',
  'natural',
  'naturally',
  'harmless',
  'approved',
]

const bannedPatterns = BANNED_TERMS.map((term) => ({
  term,
  // Two-word terms also match with extra spaces or a line break between the words.
  re: new RegExp(`\\b${term.split(' ').join('\\s+')}\\b`, 'i'),
}))

/**
 * Checks hand-written notes before they ship: each note is non-empty, each note and caveat is at most 30 words and free of
 * banned terms, and every key is a real entry id (catches typos that would silently drop a note).
 * Returns human-readable problems; empty means fine.
 */
export function checkNotes(notes: NotesFile, entryIds: ReadonlySet<string>): string[] {
  const problems: string[] = []
  for (const [id, n] of Object.entries(notes)) {
    if (!entryIds.has(id)) problems.push(`${id}: no entry has this id (check for a typo)`)
    if (n.note.trim() === '') problems.push(`${id}: note is empty`)
    for (const field of ['note', 'caveat'] as const) {
      const text = n[field]
      if (text === undefined) continue
      const count = text.trim().split(/\s+/).filter(Boolean).length
      if (count > MAX_WORDS) problems.push(`${id}: ${field} has ${count} words (at most ${MAX_WORDS})`)
      for (const { term, re } of bannedPatterns) {
        if (re.test(text)) problems.push(`${id}: ${field} contains the banned term "${term}"`)
      }
    }
  }
  return problems
}
