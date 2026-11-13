import type { NotesFile } from './types'

export const MAX_WORDS = 30

/** Words that make a claim the listings themselves must carry; notes stay descriptive. Matched as whole words, any case. */
export const BANNED_TERMS = ['safe', 'unsafe', 'dangerous', 'toxic', 'harmful', 'causes cancer', 'carcinogen', 'carcinogenic']

const bannedPatterns = BANNED_TERMS.map((term) => ({
  term,
  // "causes cancer" also matches with extra spaces or a line break between the words.
  re: new RegExp(`\\b${term.split(' ').join('\\s+')}\\b`, 'i'),
}))

/**
 * Checks hand-written notes before they ship: each note and caveat is at most 30 words and free of
 * banned terms, and every key is a real entry id (catches typos that would silently drop a note).
 * Returns human-readable problems; empty means fine.
 */
export function checkNotes(notes: NotesFile, entryIds: ReadonlySet<string>): string[] {
  const problems: string[] = []
  for (const [id, n] of Object.entries(notes)) {
    if (!entryIds.has(id)) problems.push(`${id}: no entry has this id (check for a typo)`)
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
