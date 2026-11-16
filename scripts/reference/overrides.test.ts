import { parseAliasOverrides } from './overrides'

test('alias overrides become one-name groups for the top-ranked name source', () => {
  expect(parseAliasOverrides([{ name: 'PARFUM', alias: 'Fragrance' }, { name: 'TOCOPHEROL', alias: 'Vitamin E' }, { name: '', alias: 'x' }])).toEqual([
    { joinNames: ['PARFUM'], commonNames: ['Fragrance'] },
    { joinNames: ['TOCOPHEROL'], commonNames: ['Vitamin E'] },
  ])
})
