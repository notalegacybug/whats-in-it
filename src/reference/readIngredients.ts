import { normalizeName } from '../ingredients/normalize'
import { extractIngredients } from '../ingredients/split'
import type { RefIndex } from './index'
import { mayContainAllergens } from './mayContain'
import { fullNameEnding } from './suggest'

const MAX_WORDS_IN_NAME = 6
// Short single words ("cream", "water", "honey") are CosIng names but also everyday words in prose.
const MIN_SINGLE_WORD_LENGTH = 7
// Short names that are real ingredients and rarely ordinary words in marketing copy.
const SHORT_NAMES = new Set(['parfum', 'talc', 'silica'])
const SENTENCE_WORDS = /\b(?:our|your|we|you|helps?|is|are|with|that)\b/i
const SENTENCE_LENGTH = 7
const DESCRIPTION_SHARE = 0.4

const outsideBrackets = (s: string) => s.replace(/[([【][^)\]】]*[)\]】]/g, ' ')
const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length

// Ingredient names are short noun phrases; marketing copy is sentences. Brackets are ignored so a
// food item's sub-ingredient list does not count as length.
export function looksLikeDescription(items: string[]): boolean {
  if (items.length < 2) return false
  const sentences = items.filter((item) => {
    const text = outsideBrackets(item)
    return wordCount(text) >= SENTENCE_LENGTH || SENTENCE_WORDS.test(text)
  })
  return sentences.length / items.length >= DESCRIPTION_SHARE
}

// Scans prose for known names, longest phrase first, so "Hyaluronic Acid" wins over "Acid".
export function findIngredientNames(text: string, index: RefIndex): string[] {
  const words = text.match(/[A-Za-z0-9][A-Za-z0-9'-]*/g) ?? []
  const seen = new Set<string>()
  const found: string[] = []
  for (let i = 0; i < words.length; i++) {
    for (let n = Math.min(MAX_WORDS_IN_NAME, words.length - i); n >= 1; n--) {
      if (n === 1 && words[i].length < MIN_SINGLE_WORD_LENGTH && !SHORT_NAMES.has(words[i].toLowerCase())) continue
      const phrase = words.slice(i, i + n).join(' ')
      // An exact name, or (2+ words) the end of exactly one full name, which Review then offers to complete.
      const id = index.byKey.get(normalizeName(phrase))?.id ?? (n >= 2 ? fullNameEnding(phrase, index)?.entry.id : null)
      if (!id) continue
      if (!seen.has(id)) {
        seen.add(id)
        found.push(phrase)
      }
      i += n - 1
      break
    }
  }
  return found
}

// A real list stays as written; a description becomes only the names it mentions, flagged as partial.
// The label's "may contain" warning is read separately: it is not an ingredient, but it matters to allergic people.
export function readIngredients(
  text: string,
  index: RefIndex,
): { ingredients: string[]; fromDescription: boolean; mayContain: string[] } {
  const items = extractIngredients(text)
  const mayContain = mayContainAllergens(text)
  if (!looksLikeDescription(items)) return { ingredients: items, fromDescription: false, mayContain }
  return { ingredients: findIngredientNames(text, index), fromDescription: true, mayContain }
}
