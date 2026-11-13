import { splitRouteQualifier, splitSeeReference, withEdition } from './util'

test('splitSeeReference: returns the name without the cross-reference and the parent text', () => {
  expect(splitSeeReference('Sulfuric Acid (see Strong Inorganic Acid Mists Containing Sulfuric Acid)')).toEqual({
    name: 'Sulfuric Acid',
    seeAlso: 'Strong Inorganic Acid Mists Containing Sulfuric Acid',
  })
  expect(splitSeeReference('Quartz (see Silica)')).toEqual({ name: 'Quartz', seeAlso: 'Silica' })
})

test('splitSeeReference: "see also" loses "also"; nested brackets stay in the parent text; no reference gives null', () => {
  expect(splitSeeReference('Aniline (see also Aniline hydrochloride)')).toEqual({ name: 'Aniline', seeAlso: 'Aniline hydrochloride' })
  expect(splitSeeReference('Bis(chloromethyl) Ether (see Bis(chloromethyl) Ether and Technical-Grade Chloromethyl Methyl Ether)')).toEqual({
    name: 'Bis(chloromethyl) Ether',
    seeAlso: 'Bis(chloromethyl) Ether and Technical-Grade Chloromethyl Methyl Ether',
  })
  expect(splitSeeReference('Benzene')).toEqual({ name: 'Benzene', seeAlso: null })
})

test('splitRouteQualifier: plural and variant exposure words count as route words', () => {
  for (const word of ['mists', 'dusts', 'aerosols', 'vapours', 'vapors', 'particulate', 'fibrous']) {
    expect(splitRouteQualifier(`Thing (${word})`)).toEqual({ name: 'Thing', qualifier: word })
  }
})

test('withEdition sets the edition on every listing; no edition leaves records unchanged', () => {
  const rec = { name: 'A', cas: [], listing: { source: 'NTP' as const, classification: 'c', level: 'strong' as const, year: null, url: 'u' } }
  expect(withEdition([rec], '15th Report on Carcinogens (2021)')[0].listing.edition).toBe('15th Report on Carcinogens (2021)')
  expect(withEdition([rec], undefined)).toEqual([rec])
  expect(rec.listing).not.toHaveProperty('edition')
})
