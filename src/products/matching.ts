import { normalizeName } from '../ingredients/normalize'
import type { NewProduct } from './types'

const SIMILARITY_THRESHOLD = 0.8

/** Jaccard similarity of two ingredient lists, compared on normalised names. */
export function ingredientSimilarity(a: string[], b: string[]): number {
  const setA = new Set(a.map(normalizeName))
  const setB = new Set(b.map(normalizeName))
  let shared = 0
  for (const x of setA) if (setB.has(x)) shared++
  const union = setA.size + setB.size - shared
  return union === 0 ? 0 : shared / union
}

export function isLikelySame(a: NewProduct, b: NewProduct): boolean {
  if (a.barcode && b.barcode && a.barcode === b.barcode) return true
  if (normalizeName(a.brand) !== normalizeName(b.brand)) return false
  return (
    normalizeName(a.name) === normalizeName(b.name) ||
    ingredientSimilarity(a.ingredients, b.ingredients) >= SIMILARITY_THRESHOLD
  )
}
