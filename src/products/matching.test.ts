import { ingredientSimilarity, isLikelySame, sameIngredients } from './matching'
import type { NewProduct } from './types'

const base: NewProduct = {
  name: 'Moisturiser',
  brand: 'Dove',
  type: 'cosmetic',
  barcode: null,
  ingredients: ['aqua', 'glycerin', 'parfum'],
  referenceVersion: 'v1',
}

const ten = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']

describe('ingredientSimilarity', () => {
  it('is 1 for identical lists', () => {
    expect(ingredientSimilarity(['Aqua', 'Glycerin'], ['aqua', 'GLYCERIN'])).toBe(1)
  })
  it('is 0 for disjoint lists', () => {
    expect(ingredientSimilarity(['aqua'], ['parfum'])).toBe(0)
  })
  it('is 0 for two empty lists', () => {
    expect(ingredientSimilarity([], [])).toBe(0)
  })
})

describe('isLikelySame', () => {
  it('is true when both barcodes are set and equal', () => {
    const a = { ...base, barcode: '123', brand: 'X', name: 'One' }
    const b = { ...base, barcode: '123', brand: 'Y', name: 'Two' }
    expect(isLikelySame(a, b)).toBe(true)
  })
  it('is true for the same brand and name with different casing', () => {
    expect(isLikelySame(base, { ...base, name: 'MOISTURISER', brand: 'dove', ingredients: ['x'] })).toBe(true)
  })
  it('is true for the same brand with 9 of 10 shared ingredients', () => {
    const a = { ...base, name: 'A', ingredients: ten }
    const b = { ...base, name: 'B', ingredients: [...ten.slice(0, 9), 'k'] }
    // 9 shared / 11 distinct = 0.818
    expect(isLikelySame(a, b)).toBe(true)
  })
  it('is false for a different brand with the same name and no barcode match', () => {
    expect(isLikelySame(base, { ...base, brand: 'Nivea' })).toBe(false)
  })
  it('is false for the same brand when name and ingredients both differ', () => {
    expect(isLikelySame(base, { ...base, name: 'Other', ingredients: ['x', 'y'] })).toBe(false)
  })
  it('falls back to brand and name when barcodes differ', () => {
    expect(isLikelySame({ ...base, barcode: '1' }, { ...base, barcode: '2' })).toBe(true)
  })
})

describe('sameIngredients', () => {
  it('compares normalised sets: case, spacing, order and repeats do not matter', () => {
    expect(sameIngredients(['Aqua', 'Glycerin '], ['glycerin', 'AQUA', 'aqua'])).toBe(true)
  })
  it('is false when either list has an ingredient the other lacks', () => {
    expect(sameIngredients(['aqua', 'glycerin'], ['aqua'])).toBe(false)
    expect(sameIngredients(['aqua'], ['aqua', 'parfum'])).toBe(false)
  })
})
