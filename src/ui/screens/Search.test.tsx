import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fakeStore, record, renderScreen } from '../test-helpers'
import { Search } from './Search'

async function setup(matches = [record({ id: 'p1', brand: 'Acme', name: 'Lotion' })]) {
  const store = fakeStore()
  store.search.mockImplementation(async (t: string) => (t.toLowerCase().includes('lot') ? matches : []))
  renderScreen(<Search />, { route: '/search', path: '/search', store })
  await screen.findByLabelText('Search saved products')
  return store
}

test('search: shows nothing for an empty query', async () => {
  await setup()
  expect(screen.getByLabelText('Search saved products')).toBeInTheDocument()
  expect(screen.queryByText('No saved products match.')).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: /Lotion/ })).not.toBeInTheDocument()
})

test('search: typed text lists matches linking to the result', async () => {
  const store = await setup()
  await userEvent.type(screen.getByLabelText('Search saved products'), 'lot')
  const link = await screen.findByRole('link', { name: 'Acme Lotion' })
  expect(link).toHaveAttribute('href', '/result/p1')
  expect(store.search).toHaveBeenLastCalledWith('lot')
})

test('search: no matches says so; whitespace alone shows nothing', async () => {
  await setup()
  const input = screen.getByLabelText('Search saved products')
  await userEvent.type(input, 'xyz')
  expect(await screen.findByText('No saved products match.')).toBeInTheDocument()
  await userEvent.clear(input)
  await userEvent.type(input, '  ')
  expect(screen.queryByText('No saved products match.')).not.toBeInTheDocument()
})

test('search: link home', async () => {
  await setup()
  expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
})
