import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { addScan, listScans } from './myScans'

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  vi.useFakeTimers({ toFake: ['Date'] })
})
afterEach(() => {
  vi.useRealTimers()
})

describe('my scans', () => {
  it('rescanning a product leaves one row with the later date', async () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    await addScan('p1')
    vi.setSystemTime(new Date('2026-01-05T00:00:00.000Z'))
    await addScan('p1')
    expect(await listScans()).toEqual([{ productId: 'p1', scannedAt: '2026-01-05T00:00:00.000Z' }])
  })

  it('lists scans newest first', async () => {
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    await addScan('old')
    vi.setSystemTime(new Date('2026-01-03T00:00:00.000Z'))
    await addScan('new')
    vi.setSystemTime(new Date('2026-01-02T00:00:00.000Z'))
    await addScan('mid')
    expect((await listScans()).map((s) => s.productId)).toEqual(['new', 'mid', 'old'])
  })

  it('is empty when nothing has been scanned', async () => {
    expect(await listScans()).toEqual([])
  })
})
