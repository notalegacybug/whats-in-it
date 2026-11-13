import { normalizeName } from './normalize'

const START = /ingredients?\s*[:-]/i
// Whole words only, so "Warningberry Extract" does not cut the list.
const STOP = /\b(?:may contain|contains:|allergy advice|directions|warning|caution|distributed by|manufactured by|storage)(?![a-z])/i
// Cosmetic "May contain (+/-)" introduces colourants that belong to the list, so it is not a stop.
const MAY_CONTAIN_PLUS_MINUS = /\.?\s*\bmay contain\s*:?\s*(?:\(\+\/-\)|\[\+\/-\]|\+\/-)\s*:?/gi
const OPEN = '(['
const CLOSE = ')]'

// A comma between digits (1,4-Dioxane) is part of a chemical name, not a separator.
function splitTopLevel(text: string, separators: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (OPEN.includes(ch)) depth++
    else if (CLOSE.includes(ch)) depth = Math.max(0, depth - 1)
    const digitComma = ch === ',' && /\d/.test(text[i - 1] ?? '') && /\d/.test(text[i + 1] ?? '')
    if (depth === 0 && separators.includes(ch) && !digitComma) {
      parts.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  parts.push(current)
  return parts
}

export function extractIngredients(text: string): string[] {
  let body = text
  const start = START.exec(body)
  if (start) body = body.slice(start.index + start[0].length)
  body = body.replace(MAY_CONTAIN_PLUS_MINUS, ',')
  const stop = STOP.exec(body)
  if (stop) body = body.slice(0, stop.index)

  body = body.replace(/-\s*\n\s*/g, '').replace(/\s*\n\s*/g, ' ')

  const seen = new Set<string>()
  const items: string[] = []
  for (const part of splitTopLevel(body, ',;•·')) {
    const display = part.replace(/\s+/g, ' ').trim()
    const key = normalizeName(display)
    if (!key || seen.has(key)) continue
    seen.add(key)
    items.push(display)
  }
  if (items.length > 0) items[items.length - 1] = items[items.length - 1].replace(/\.$/, '')
  return items
}

function splitBrackets(text: string): { outside: string; inner: string[] } {
  let outside = ''
  const inner: string[] = []
  let depth = 0
  let current = ''
  for (const ch of text) {
    if (OPEN.includes(ch)) {
      if (depth++ === 0) continue
    } else if (CLOSE.includes(ch)) {
      if (--depth === 0) {
        inner.push(current)
        current = ''
        continue
      }
      depth = Math.max(0, depth)
    }
    if (depth === 0) outside += ch
    else current += ch
  }
  if (current) inner.push(current) // unclosed bracket
  return { outside, inner }
}

function componentTexts(text: string): string[] {
  const { outside, inner } = splitBrackets(text)
  return [outside, ...inner.flatMap((s) => splitTopLevel(s, ',').flatMap(componentTexts))]
}

// A polymer's `/` joins monomers of one substance; splitting it would give a false "Watch for".
const POLYMER = /\b(?:co|cross)?polymer\b/i

export function matchGroups(ingredient: string): { whole: string; groups: string[][] } {
  const seen = new Set<string>()
  const groups: string[][] = []
  for (const text of componentTexts(ingredient)) {
    const names = (POLYMER.test(text) ? [text] : text.split('/')).map(normalizeName).filter(Boolean)
    const key = names.join('/')
    if (!key || seen.has(key)) continue
    seen.add(key)
    groups.push(names)
  }
  return { whole: normalizeName(ingredient), groups }
}
