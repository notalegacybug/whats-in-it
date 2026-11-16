import { foodAllergens } from './foodAllergens'

test.each([
  ['Skimmed Milk Powder', ['Milk']],
  ['Whey Protein Concentrate', ['Milk']],
  ['Butter', ['Milk']],
  ['Egg Yolk', ['Egg']],
  ['Roasted Peanuts', ['Peanuts']],
  ['Arachis Hypogaea Oil', ['Peanuts']],
  ['Prunus Amygdalus Dulcis (Sweet Almond) Oil', ['Tree nuts']],
  ['Hazelnut Paste', ['Tree nuts']],
  ['Wheat Flour (Wheat Flour, Calcium Carbonate)', ['Gluten (wheat, rye, barley, oats)']],
  ['Avena Sativa (Oat) Kernel Flour', ['Gluten (wheat, rye, barley, oats)']],
  ['Soy Lecithin', ['Soy']],
  ['Glycine Soja (Soybean) Oil', ['Soy']],
  ['Anchovy Extract', ['Fish']],
  ['Shrimp Powder', ['Crustaceans']],
  ['Snail Secretion Filtrate', ['Molluscs']],
  ['Celery Seed', ['Celery']],
  ['Mustard Flour', ['Mustard']],
  ['Sesame Seeds', ['Sesame']],
  ['Lupin Flour', ['Lupin']],
  ['Sodium Metabisulphite', ['Sulphites']],
  ['Preservative (E223)', ['Sulphites']],
  ['Milk Chocolate (Sugar, Cocoa Butter, Whole Milk Powder, Soya Lecithin)', ['Milk', 'Soy']],
])('%s is tagged %j', (text, groups) => {
  expect(foodAllergens(text)).toEqual(groups)
})

test.each([
  'Butyrospermum Parkii (Shea) Butter',
  'Theobroma Cacao (Cocoa) Seed Butter',
  'Buckwheat Flour',
  'Glycine',
  'Coconut Oil',
  'Nutmeg',
  'Water',
  'Butylene Glycol',
])('%s is not tagged', (text) => {
  expect(foodAllergens(text)).toEqual([])
})
