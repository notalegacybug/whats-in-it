import { prepareProp65 } from './prop65Prepare'

// FIXTURE, NOT REAL DATA: shaped like OEHHA's p65chemicalslist.csv (title rows, header, sub-rows, footnotes).
const raw = [
  ['STATE OF CALIFORNIA', '', '', '', ''],
  ['PROPOSITION 65 LIST OF CARCINOGENS OR REPRODUCTIVE TOXICANTS', '', '', '', ''],
  ['31-Jul-26', '', '', '', ''],
  ['Chemical', 'Type of Toxicity', 'Listing Mechanism', 'CAS No.', 'Date Listed'],
  ['Acetaldehyde', 'cancer', 'SQE', '75-07-0', '1-Apr-88'],
  ['Abiraterone acetate', 'developmental, female, male ', 'FR', '154229-18-2', '8-Apr-16'],
  ['Allyl chloride  Delisted October 29, 1999 [Click here for the basis for delisting]', 'cancer', 'AB', '107-05-1', '1-Jan-90'],
  ['Lead [Basis for listing changed effective November 22, 2013]', 'developmental, female, male', 'AB', '---', '27-Feb-87'],
  ['Lead and lead compounds', 'cancer', 'AB', '---', '1-Oct-92'],
  ['   Lead', '', '', '', ''],
  ['Di(2-ethylhexyl)phthalate (DEHP)', 'developmental, male ', 'AB', '117-81-7', '24-Oct-03'],
  ['   Adultb', '', '', '', ''],
  ['   Infant boys, age 29 days to 24 monthsb', '', '', '', ''],
  ['Phenyl glycidyl ether   \nDelisted April 4, 2014 [Click here]', 'male ', 'LC', '122-60-1', '7-Aug-09'],
  ['a Where a source or product results in exposures by multiple routes, the higher level applies', '', '', '', ''],
]

test('Prop 65 preparation: header found, delisted and note rows dropped, group members inherit, years read', () => {
  expect(prepareProp65(raw)).toEqual([
    { Chemical: 'Acetaldehyde', 'Type of Toxicity': 'cancer', 'CAS No.': '75-07-0', 'Date Listed': '1988-04-01' },
    { Chemical: 'Abiraterone acetate', 'Type of Toxicity': 'developmental, female, male', 'CAS No.': '154229-18-2', 'Date Listed': '2016-04-08' },
    { Chemical: 'Lead', 'Type of Toxicity': 'developmental, female, male', 'CAS No.': '---', 'Date Listed': '1987-02-27' },
    { Chemical: 'Lead and lead compounds', 'Type of Toxicity': 'cancer', 'CAS No.': '---', 'Date Listed': '1992-10-01' },
    { Chemical: 'Lead', 'Type of Toxicity': 'cancer', 'CAS No.': '---', 'Date Listed': '1992-10-01' },
    { Chemical: 'Di(2-ethylhexyl)phthalate (DEHP)', 'Type of Toxicity': 'developmental, male', 'CAS No.': '117-81-7', 'Date Listed': '2003-10-24' },
  ])
})

test('Prop 65 preparation: a file without the expected header is refused', () => {
  expect(() => prepareProp65([['Name', 'Toxicity']])).toThrow(/header/)
})

test('Prop 65 preparation: square brackets in chemical names are kept; only note brackets are removed', () => {
  const rows = prepareProp65([
    ['Chemical', 'Type of Toxicity', 'Listing Mechanism', 'CAS No.', 'Date Listed'],
    ['Dibenzo[a,h]pyrene', 'cancer', 'AB', '189-64-0', '1-Jan-88'],
    ['Benzo[b]fluoranthene', 'cancer', 'AB', '205-99-2', '1-Jul-87'],
    ['Lead [Basis for listing changed effective November 22, 2013]', 'developmental', 'AB', '---', '27-Feb-87'],
  ])
  expect(rows.map((r) => r.Chemical)).toEqual(['Dibenzo[a,h]pyrene', 'Benzo[b]fluoranthene', 'Lead'])
})
