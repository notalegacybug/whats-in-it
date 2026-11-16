import { buildIndex } from './index'
import { findIngredientNames, looksLikeDescription, readIngredients } from './readIngredients'
import type { RefEntry } from './types'

const entry = (name: string, aliases: string[] = []): RefEntry => ({ id: `name:${name}`, name, aliases, cas: [], listings: [] })
const index = buildIndex({
  version: 't',
  builtAt: '2026-01-01',
  entries: [
    entry('Hyaluronic Acid'),
    entry('Niacinamide'),
    entry('Squalane'),
    entry('Hydrolyzed Collagen'),
    entry('Cream'),
    entry('Acid'),
    entry('Water', ['aqua']),
    entry('Glycerin'),
  ],
})

const PASSAGE =
  '【With Niacinamide & Multi-Molecular Hyaluronic Acid】 – Enriched with Niacinamide and multiple molecular weights of ' +
  'Hyaluronic Acid, our capsule cream provides intense moisture that helps plump and hydrate the skin. Squalane is included ' +
  'to help support the skin barrier. Our advanced formula features a powerful blend of Peptides, Hydrolyzed Collagen, and water.'

test('a marketing passage is recognised as a description', () => {
  expect(looksLikeDescription(['Enriched with Niacinamide and multiple molecular weights of Hyaluronic Acid', 'our capsule cream provides intense moisture that helps plump', 'Water'])).toBe(true)
})

test('real ingredient lists are not descriptions', () => {
  expect(looksLikeDescription(['Aqua', 'Glycerin', 'Ricinus Communis (Castor) Seed Oil', 'Tocopherol'])).toBe(false)
  expect(looksLikeDescription(['Wheat flour (wheat flour, calcium carbonate, iron, niacin, thiamin)', 'Sugar', 'Palm oil'])).toBe(false)
  expect(looksLikeDescription(['Aqua'])).toBe(false)
})

test('names in a passage are found once each, longest match first, in text order and casing', () => {
  expect(findIngredientNames(PASSAGE, index)).toEqual(['Niacinamide', 'Hyaluronic Acid', 'Squalane', 'Hydrolyzed Collagen'])
})

test('short everyday single words are not taken as ingredients', () => {
  const found = findIngredientNames(PASSAGE, index)
  expect(found).not.toContain('cream')
  expect(found).not.toContain('water')
})

test('readIngredients keeps a real list as a list', () => {
  expect(readIngredients('Ingredients: Aqua, Glycerin, Niacinamide', index)).toEqual({
    ingredients: ['Aqua', 'Glycerin', 'Niacinamide'],
    fromDescription: false,
  })
})

test('readIngredients turns a description into the names it mentions', () => {
  expect(readIngredients(PASSAGE, index)).toEqual({
    ingredients: ['Niacinamide', 'Hyaluronic Acid', 'Squalane', 'Hydrolyzed Collagen'],
    fromDescription: true,
  })
})

test('a description phrase that is the end of one full name is picked up, as written, for the review screen to suggest', () => {
  const idx = buildIndex({
    version: 't',
    builtAt: '2026-01-01',
    entries: [entry('Panax Ginseng Root Extract'), entry('Hydrolyzed Ginseng Root Extract'), entry('Glutathione')],
  })
  const text = 'We have included Ginseng Root Extract and Glutathione in our cream, to help your skin feel firm, while we keep it light.'
  expect(readIngredients(text, idx).ingredients).toEqual(['Ginseng Root Extract', 'Glutathione'])
})

test('a few short real ingredient names are found in prose', () => {
  const idx = buildIndex({ version: 't', builtAt: '2026-01-01', entries: [entry('Parfum'), entry('Talc'), entry('Linalool')] })
  const text = 'Our blend features Parfum and Linalool with a touch of Talc, so your hair feels soft while we keep it light.'
  expect(readIngredients(text, idx).ingredients).toEqual(['Parfum', 'Linalool', 'Talc'])
})
