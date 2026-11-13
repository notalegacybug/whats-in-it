import { render, screen } from '@testing-library/react'
import type { IngredientResult, Listing, RefEntry } from '../../reference/types'
import { ResultItem } from './ResultItem'

const listing = (extra: Partial<Listing>): Listing => ({
  source: 'NTP',
  classification: 'Known to be a human carcinogen',
  level: 'strong',
  year: null,
  url: 'https://ntp.niehs.nih.gov/go/roc',
  ...extra,
})
const watched = (listings: Listing[]): IngredientResult => {
  const entry: RefEntry = { id: 'cas:50-00-0', name: 'Formaldehyde', aliases: [], cas: ['50-00-0'], listings }
  return { input: 'Formaldehyde', verdict: 'watch_strong', matches: [{ key: 'formaldehyde', verdict: 'watch_strong', entry }] }
}
const show = (r: IngredientResult) => render(<ul><ResultItem result={r} /></ul>)

test('result item: a listing without a year shows its edition', () => {
  show(watched([listing({ edition: '15th Report on Carcinogens (2021)' })]))
  expect(
    screen.getByRole('link', { name: 'NTP · Known to be a human carcinogen · 15th Report on Carcinogens (2021)' }),
  ).toBeInTheDocument()
})

test('result item: a year wins over an edition', () => {
  show(watched([listing({ source: 'IARC', classification: 'Group 1', year: 2012, edition: 'Volumes 1-142' })]))
  expect(screen.getByRole('link', { name: 'IARC · Group 1 · 2012' })).toBeInTheDocument()
})

test('result item: with neither, the part is left out', () => {
  show(watched([listing({})]))
  expect(screen.getByRole('link', { name: 'NTP · Known to be a human carcinogen' })).toBeInTheDocument()
})

test('result item: when some parts were recognised, it names only the parts it could not check', () => {
  const glycerin: RefEntry = { id: 'name:glycerin', name: 'Glycerin', aliases: [], cas: [], listings: [] }
  show({
    input: 'Glycerin (Xyzzium, Plugh)',
    verdict: 'not_recognised',
    matches: [
      { key: 'glycerin', verdict: 'no_known_concern', entry: glycerin },
      { key: 'xyzzium', verdict: 'not_recognised', entry: null },
      { key: 'plugh', verdict: 'not_recognised', entry: null },
    ],
  })
  expect(screen.getByText("We couldn't check: xyzzium, plugh")).toBeInTheDocument()
  expect(screen.queryByText("We couldn't check this one.")).not.toBeInTheDocument()
})

test('result item: when nothing was recognised, it says so plainly', () => {
  show({ input: 'Xyzzium', verdict: 'not_recognised', matches: [{ key: 'xyzzium', verdict: 'not_recognised', entry: null }] })
  expect(screen.getByText("We couldn't check this one.")).toBeInTheDocument()
})

test('result item: a function description reads as a use, not a rating', () => {
  const glycerin: RefEntry = { id: 'name:glycerin', name: 'Glycerin', aliases: [], cas: [], listings: [], functionNote: 'humectant, solvent' }
  show({ input: 'Glycerin', verdict: 'no_known_concern', matches: [{ key: 'glycerin', verdict: 'no_known_concern', entry: glycerin }] })
  expect(screen.getByText('Used as: humectant, solvent')).toBeInTheDocument()
})
