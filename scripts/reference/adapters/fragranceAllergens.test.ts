import { parseFragranceAllergens } from './fragranceAllergens'

test('fragrance allergens: label names split on ";", CAS numbers on ";" or "/"', () => {
  expect(
    parseFragranceAllergens([
      { Name: 'Citral; Geranial; Neral', 'Chemical name': 'x', CAS: '5392-40-5; 141-27-5; 106-26-3', 'Annex III ref': '70' },
      { Name: 'Limonene', 'Chemical name': 'y', CAS: '138-86-3/ 7705-14-8', 'Annex III ref': '88' },
      { Name: '', 'Chemical name': '', CAS: '', 'Annex III ref': '' },
    ]),
  ).toEqual([
    { names: ['Citral', 'Geranial', 'Neral'], cas: ['5392-40-5', '141-27-5', '106-26-3'] },
    { names: ['Limonene'], cas: ['138-86-3', '7705-14-8'] },
  ])
})
