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

test('search: a failing search shows an alert', async () => {
  const store = await setup()
  store.search.mockRejectedValue(new Error('idb blocked'))
  await userEvent.type(screen.getByLabelText('Search saved products'), 'lot')
  expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't search saved products.")
})

test('search: a slow earlier query never overwrites the newer one', async () => {
  const store = await setup()
  let releaseFirst!: (r: ReturnType<typeof record>[]) => void
  store.search.mockImplementation((t: string) =>
    t === 'a'
      ? new Promise((res) => {
          releaseFirst = res
        })
      : Promise.resolve([record({ id: 'p2', brand: 'New', name: 'Result' })]),
  )
  const input = screen.getByLabelText('Search saved products')
  await userEvent.type(input, 'a')
  await userEvent.type(input, 'b')
  expect(await screen.findByRole('link', { name: 'New Result' })).toBeInTheDocument()
  releaseFirst([record({ id: 'p1', brand: 'Old', name: 'Result' })])
  await new Promise((r) => setTimeout(r, 20))
  expect(screen.queryByRole('link', { name: 'Old Result' })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'New Result' })).toBeInTheDocument()
})

test('search: "No saved products match." does not flash before the new query resolves', async () => {
  const store = await setup()
  store.search.mockImplementation((t: string) =>
    t === 'ab' ? new Promise(() => {}) : Promise.resolve([record({ id: 'p1' })]),
  )
  const input = screen.getByLabelText('Search saved products')
  await userEvent.type(input, 'a')
  await screen.findByRole('link', { name: 'Acme Lotion' })
  await userEvent.type(input, 'b')
  expect(screen.queryByText('No saved products match.')).not.toBeInTheDocument()
})
