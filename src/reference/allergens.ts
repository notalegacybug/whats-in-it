import { foodAllergens } from './foodAllergens'
import type { IngredientResult } from './types'

const SHORT: Record<string, string> = { 'Gluten (wheat, rye, barley, oats)': 'gluten' }

// Allergens are information, not a verdict: they never move an ingredient into "Watch for".
export function allergensOf(result: IngredientResult): string[] {
  const fragrance = result.matches.some((m) => m.entry?.fragranceAllergen) ? ['fragrance'] : []
  return [...fragrance, ...foodAllergens(result.input).map((g) => SHORT[g] ?? g.toLowerCase())]
}
