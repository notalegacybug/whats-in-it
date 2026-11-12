import { normalizeName } from './normalize'

test.each([
  ['  Titanium   Dioxide ', 'titanium dioxide'],
  ['Glycerin 5%', 'glycerin'],
  ['E 171', 'e171'],
  ['Sodium Benzoate*', 'sodium benzoate'],
  ['PARFUM (Fragrance).', 'parfum (fragrance)'],
  ['Café extract', 'cafe extract'],
  ['Sodium‑Laureth–Sulfate', 'sodium-laureth-sulfate'],
])('normalizeName(%j)', (raw, out) => expect(normalizeName(raw)).toBe(out))
