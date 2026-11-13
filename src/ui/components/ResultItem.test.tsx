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
