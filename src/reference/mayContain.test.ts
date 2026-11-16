import { mayContainAllergens } from './mayContain'

test.each([
  ['Ingredients: Water, Salt. May contain: nuts.', ['Tree nuts']],
  ['Ingredients: Flour, Sugar. May contain traces of milk and peanuts.', ['Milk', 'Peanuts']],
  ['Ingredients: Oats. Made in a factory that also handles sesame and mustard.', ['Mustard', 'Sesame']],
  ['Ingredients: Rice. Produced on equipment that also processes soya and egg.', ['Egg', 'Soy']],
  ['Ingredients: Cocoa. May also contain hazelnuts, almonds.', ['Tree nuts']],
  ['Ingredients: Sugar, Glucose Syrup. Allergy advice: may contain wheat.', ['Gluten (wheat, rye, barley, oats)']],
])('%s -> %j', (text, groups) => {
  expect(mayContainAllergens(text)).toEqual(groups)
})

test.each([
  'Ingredients: Aqua, Glycerin. May contain (+/-): CI 77491, CI 77492.',
  'Ingredients: Milk, Sugar, Salt.',
  'Ingredients: Water. May contain: no allergens listed here.',
])('%s -> nothing', (text) => {
  expect(mayContainAllergens(text)).toEqual([])
})
