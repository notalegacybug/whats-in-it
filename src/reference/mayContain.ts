import { foodAllergens, ORDER } from './foodAllergens'

// Precautionary allergen statements: not ingredients, but cross-contact warnings from where the food is made.
const STATEMENT =
  /\b(?:may (?:also )?contain|traces? of|(?:made|produced|manufactured|packed) (?:in|on) (?:a )?(?:factory|site|facility|equipment|premises|line)s? (?:that|which) (?:also )?(?:handles?|process(?:es)?|uses?))\b([^.]*)/gi
// Cosmetics write "May contain (+/-)" before colours that are part of the ingredient list.
const COSMETIC_COLOURS = /^\s*:?\s*(?:\(\+\/-\)|\[\+\/-\]|\+\/-)/

export function mayContainAllergens(text: string): string[] {
  const groups = new Set<string>()
  for (const m of text.matchAll(STATEMENT)) {
    const rest = m[1] ?? ''
    if (COSMETIC_COLOURS.test(rest)) continue
    for (const g of foodAllergens(rest)) groups.add(g)
    // "May contain nuts" means tree nuts (peanuts are always named separately on EU labels).
    if (/\bnuts\b/i.test(rest) && !/\bpeanuts?\b/i.test(rest.replace(/\bnuts\b/i, ''))) groups.add('Tree nuts')
  }
  return [...groups].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
}
