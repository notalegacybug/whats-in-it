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
    .toEqual({ whole: 'aqua/water/eau', groups: [['aqua', 'water', 'eau']], kinds: ['main'] })
  expect(matchGroups('colour (E171)'))
    .toEqual({ whole: 'colour (e171)', groups: [['colour'], ['e171']], kinds: ['main', 'synonym'] })
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

test('matchGroups keeps a polymer name whole instead of splitting it on "/"', () => {
  expect(matchGroups('Styrene/Acrylates Copolymer').groups).toEqual([['styrene/acrylates copolymer']])
  expect(matchGroups('Acrylates/C10-30 Alkyl Acrylate CROSSPOLYMER').groups)
    .toEqual([['acrylates/c10-30 alkyl acrylate crosspolymer']])
  expect(matchGroups('Binder (Styrene/Acrylates Polymer, Aqua/Water)').groups)
    .toEqual([['binder'], ['styrene/acrylates polymer'], ['aqua', 'water']])
  expect(matchGroups('Polymerase/Water').groups).toEqual([['polymerase', 'water']])
})

test('"May contain (+/-)" introduces cosmetic colourants: the marker is dropped and they are kept', () => {
  expect(extractIngredients('Ingredients: Aqua, Glycerin. May contain (+/-): CI 77491, CI 77492.'))
    .toEqual(['Aqua', 'Glycerin', 'CI 77491', 'CI 77492'])
  expect(extractIngredients('Ingredients: Aqua, Glycerin, may contain: [+/-] CI 77491'))
    .toEqual(['Aqua', 'Glycerin', 'CI 77491'])
  expect(extractIngredients('Ingredients: Aqua. MAY CONTAIN +/- CI 77491, CI 77492'))
    .toEqual(['Aqua', 'CI 77491', 'CI 77492'])
})
test('plain "May contain" (a food allergen statement) still ends the list', () => {
  expect(extractIngredients('Ingredients: Water, Salt. May contain: nuts')).toEqual(['Water', 'Salt'])
})
test('stop phrases match whole words only', () => {
  expect(extractIngredients('Ingredients: Water, Warningberry Extract')).toEqual(['Water', 'Warningberry Extract'])
  expect(extractIngredients('Ingredients: Water, Cautionary Leaf, Restorage Oil'))
    .toEqual(['Water', 'Cautionary Leaf', 'Restorage Oil'])
  expect(extractIngredients('Ingredients: Water, Salt. Warning: keep away from eyes')).toEqual(['Water', 'Salt'])
})

test('marketing claim lines before an unheaded list are dropped', () => {
  const label =
    '-Hyaluronic Acid: Retains moisture.\n-Ceramides: Hydrate and smooth.\n\nC12-15 Alkyl Benzoate, Synthetic Wax, Mica.'
  expect(extractIngredients(label)).toEqual(['C12-15 Alkyl Benzoate', 'Synthetic Wax', 'Mica'])
})

test('a one-line list with a function prefix is not treated as a claim line', () => {
  expect(extractIngredients('Preservative: Formaldehyde, Water')).toEqual(['Preservative: Formaldehyde', 'Water'])
})

test('stray symbols from a photo are removed', () => {
  expect(extractIngredients('Ingredients: Glycerin, § Mica, Tin ‘Oxide, Water™')).toEqual(['Glycerin', 'Mica', 'Tin Oxide', 'Water'])
})

test('in an all-capitals label, short lowercase scraps are photo noise and are dropped', () => {
  expect(extractIngredients('INGREDIENTS: GLYCERIN, CETYL Ei] PEG/PPG-10/1 vl DIMETHICONE, MICA')).toEqual([
    'GLYCERIN',
    'CETYL PEG/PPG-10/1 DIMETHICONE',
    'MICA',
  ])
})

test('mixed-case labels keep their short words', () => {
  expect(extractIngredients('Ingredients: Vitamin E (as dl-alpha Tocopherol), Aloe vera')).toEqual([
    'Vitamin E (as dl-alpha Tocopherol)',
    'Aloe vera',
  ])
})
