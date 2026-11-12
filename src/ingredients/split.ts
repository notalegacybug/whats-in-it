import { normalizeName } from './normalize'

const START = /ingredients?\s*[:-]/i
const STOP = /may contain|contains:|allergy advice|directions|warning|caution|distributed by|manufactured by|storage/i
const OPEN = '(['
const CLOSE = ')]'

/** Split on the given separators, but only outside brackets. */
function splitTopLevel(text: string, separators: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const ch of text) {
    if (OPEN.includes(ch)) depth++
    else if (CLOSE.includes(ch)) depth = Math.max(0, depth - 1)
    if (depth === 0 && separators.includes(ch)) {
      parts.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  parts.push(current)
  return parts
}

/** Pull the ingredient list out of label text as display strings. */
export function extractIngredients(text: string): string[] {
  let body = text
  const start = START.exec(body)
  if (start) body = body.slice(start.index + start[0].length)
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

/**
 * Break one ingredient into components: the text outside brackets, then each
 * comma-separated part inside them. Each component lists its `/` alternatives.
 */
export function matchGroups(ingredient: string): { whole: string; groups: string[][] } {
  let outside = ''
  const inner: string[] = []
  let depth = 0
  let current = ''
  for (const ch of ingredient) {
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

  const texts = [outside, ...inner.flatMap((s) => splitTopLevel(s, ','))]
  const seen = new Set<string>()
  const groups: string[][] = []
  for (const text of texts) {
    const names = text.split('/').map(normalizeName).filter(Boolean)
    const key = names.join('/')
    if (!key || seen.has(key)) continue
    seen.add(key)
    groups.push(names)
  }
  return { whole: normalizeName(ingredient), groups }
}
