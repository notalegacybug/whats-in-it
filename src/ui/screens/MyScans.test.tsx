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
