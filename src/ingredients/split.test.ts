import { extractIngredients, matchGroups } from './split'

test('cosmetic label', () => {
  expect(extractIngredients(
    'Directions: apply daily. Ingredients: Aqua/Water/Eau, Glycerin, Titanium Dioxide (CI 77891), Parfum. May contain: nuts',
  )).toEqual(['Aqua/Water/Eau', 'Glycerin', 'Titanium Dioxide (CI 77891)', 'Parfum'])
})
test('food label keeps bracketed sub-ingredients inside their parent', () => {
  expect(extractIngredients(
    'INGREDIENTS: Wheat flour (wheat flour, calcium carbonate, iron), sugar, colour (E171), salt. Allergy advice: see bold.',
  )).toEqual(['Wheat flour (wheat flour, calcium carbonate, iron)', 'sugar', 'colour (E171)', 'salt'])
})
test('line-break hyphen from text reading is joined', () => {
  expect(extractIngredients('Ingredients: Sodium Ben-\nzoate, Water')).toEqual(['Sodium Benzoate', 'Water'])
})
test('no "ingredients" keyword uses the whole text', () => {
  expect(extractIngredients('Water; Sugar • Salt')).toEqual(['Water', 'Sugar', 'Salt'])
})
test('duplicates and empties are dropped', () => {
  expect(extractIngredients('Ingredients: Water, , water, Salt,')).toEqual(['Water', 'Salt'])
})
test('empty input', () => expect(extractIngredients('')).toEqual([]))

test('matchGroups', () => {
  expect(matchGroups('Aqua/Water/Eau'))
    .toEqual({ whole: 'aqua/water/eau', groups: [['aqua', 'water', 'eau']] })
  expect(matchGroups('colour (E171)'))
    .toEqual({ whole: 'colour (e171)', groups: [['colour'], ['e171']] })
  expect(matchGroups('Wheat flour (wheat flour, calcium carbonate)').groups)
    .toEqual([['wheat flour'], ['calcium carbonate']])
  expect(matchGroups('Glycerin').groups).toEqual([['glycerin']])
})

test('matchGroups handles square brackets, alternatives in brackets and drops duplicate/empty groups', () => {
  expect(matchGroups('Colour [E171/Titanium Dioxide, e171/titanium dioxide, ]').groups)
    .toEqual([['colour'], ['e171', 'titanium dioxide']])
})
test('extractIngredients does not split inside square brackets and collapses spacing', () => {
  expect(extractIngredients('Ingredients: Oil   blend [palm, sunflower], Salt.')).toEqual(['Oil blend [palm, sunflower]', 'Salt'])
})

test('digit-comma chemical names stay whole', () => {
  expect(extractIngredients('Ingredients: Water, 1,2-Hexanediol, 1,4-Dioxane'))
    .toEqual(['Water', '1,2-Hexanediol', '1,4-Dioxane'])
  expect(matchGroups('Solvent (1,4-Dioxane, Water)').groups)
    .toEqual([['solvent'], ['1,4-dioxane'], ['water']])
  expect(matchGroups('1,3-Butylene Glycol').groups).toEqual([['1,3-butylene glycol']])
})
test('nested brackets are decomposed recursively', () => {
  expect(matchGroups('Wheat flour (wheat flour (calcium carbonate), iron)').groups)
    .toEqual([['wheat flour'], ['calcium carbonate'], ['iron']])
})
