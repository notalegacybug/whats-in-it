import { screen } from '@testing-library/react'
import { listScans } from '../../scans/myScans'
import { fakeStore, record, renderScreen } from '../test-helpers'
import { MyScans } from './MyScans'

vi.mock('../../scans/myScans', () => ({ listScans: vi.fn() }))

const renderScans = (store = fakeStore()) => renderScreen(<MyScans />, { route: '/scans', path: '/scans', store })

test('my scans: lists scanned products newest first, each linking to its result', async () => {
  vi.mocked(listScans).mockResolvedValue([
    { productId: 'b', scannedAt: '2026-03-02T00:00:00Z' },
    { productId: 'a', scannedAt: '2026-03-01T00:00:00Z' },
  ])
  renderScans(fakeStore([record({ id: 'a', brand: 'Acme', name: 'Lotion' }), record({ id: 'b', brand: 'Zed', name: 'Soap' })]))
  const links = await screen.findAllByRole('link', { name: /Lotion|Soap/ })
  expect(links.map((l) => l.textContent)).toEqual(['Zed Soap', 'Acme Lotion'])
  expect(links[0]).toHaveAttribute('href', '/result/b')
  expect(screen.getByText(new Date('2026-03-02T00:00:00Z').toLocaleDateString())).toBeInTheDocument()
})

test('my scans: skips a scan whose product is gone', async () => {
  vi.mocked(listScans).mockResolvedValue([
    { productId: 'gone', scannedAt: '2026-03-02T00:00:00Z' },
    { productId: 'a', scannedAt: '2026-03-01T00:00:00Z' },
  ])
  renderScans(fakeStore([record({ id: 'a' })]))
  expect(await screen.findByRole('link', { name: 'Acme Lotion' })).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(1)
})

test('my scans: empty state, and a link home', async () => {
  vi.mocked(listScans).mockResolvedValue([])
  renderScans()
  expect(await screen.findByText('Nothing scanned yet.')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
})

test('my scans: a failing load shows an alert instead of staying blank', async () => {
  vi.mocked(listScans).mockRejectedValue(new Error('idb blocked'))
  renderScans()
  expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load your saved scans.")
  expect(screen.queryByText('Nothing scanned yet.')).not.toBeInTheDocument()
})

test('my scans: shows a loading status until the list arrives', async () => {
  let release!: (r: []) => void
  vi.mocked(listScans).mockReturnValue(new Promise((res) => { release = res }))
  renderScans()
  expect(await screen.findByText('Loading…')).toHaveAttribute('role', 'status')
  release([])
  await screen.findByText('Nothing scanned yet.')
})

test('my scans: one product failing to load skips only that row', async () => {
  vi.mocked(listScans).mockResolvedValue([
    { productId: 'bad', scannedAt: '2026-03-02T00:00:00Z' },
    { productId: 'a', scannedAt: '2026-03-01T00:00:00Z' },
  ])
  const store = fakeStore([record({ id: 'a' })])
  const get = store.get.getMockImplementation()!
  store.get.mockImplementation(async (id: string) => {
    if (id === 'bad') throw new Error('boom')
    return get(id)
  })
  renderScans(store)
  expect(await screen.findByRole('link', { name: 'Acme Lotion' })).toBeInTheDocument()
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
})

test('my scans: delete asks first, then removes the product from the list and the phone', async () => {
  const userEvent = (await import('@testing-library/user-event')).default
  const user = userEvent.setup()
  vi.mocked(listScans).mockResolvedValue([
    { productId: 'b', scannedAt: '2026-03-02T00:00:00Z' },
    { productId: 'a', scannedAt: '2026-03-01T00:00:00Z' },
  ])
  const store = fakeStore([record({ id: 'a', brand: 'Acme', name: 'Lotion' }), record({ id: 'b', brand: 'Zed', name: 'Soap' })])
  renderScans(store)
  await user.click(await screen.findByRole('button', { name: 'Delete Zed Soap' }))
  expect(screen.getByRole('alertdialog')).toHaveTextContent("Delete Zed Soap? It is removed from this phone and can't be undone.")
  await user.click(screen.getByRole('button', { name: 'Cancel' }))
  expect(store.delete).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Delete Zed Soap' }))
  await user.click(screen.getByRole('button', { name: 'Yes, delete' }))
  expect(store.delete).toHaveBeenCalledWith('b')
  expect(screen.queryByRole('link', { name: 'Zed Soap' })).not.toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Acme Lotion' })).toBeInTheDocument()
})
