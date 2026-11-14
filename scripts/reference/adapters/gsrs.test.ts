import { parseGsrs } from './gsrs'

// FIXTURE, NOT REAL DATA: invented rows in the gsrs-names.csv layout.
const rows = [
  { UNII: 'U1', Name: 'COCONUT OIL [MI]', Type: 'cn' },
  { UNII: 'U1', Name: 'Coconut oil', Type: 'cn' },
  { UNII: 'U1', Name: 'COCOS NUCIFERA (COCONUT) OIL', Type: 'of' },
  { UNII: 'U1', Name: 'COCOS NUCIFERA SEED OIL', Type: 'sys' },
  { UNII: 'U1', Name: 'COCONUT VIRGIN OIL', Type: 'bn' },
  { UNII: 'U1', Name: 'ABC-123', Type: 'cd' },
  { UNII: 'U2', Name: 'SHEA BUTTER [MART.] [II]', Type: 'cn' },
  { UNII: '', Name: 'ORPHAN', Type: 'cn' },
]

test('GSRS: groups names by substance, strips publication tags, ignores codes and brands', () => {
  expect(parseGsrs(rows)).toEqual([
    {
      joinNames: ['COCONUT OIL', 'Coconut oil', 'COCOS NUCIFERA (COCONUT) OIL', 'COCOS NUCIFERA SEED OIL'],
      commonNames: ['COCONUT OIL', 'Coconut oil', 'COCOS NUCIFERA (COCONUT) OIL'],
    },
    { joinNames: ['SHEA BUTTER'], commonNames: ['SHEA BUTTER'] },
  ])
})
