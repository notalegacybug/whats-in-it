import { loadReference, refreshReference, resetReferenceForTests } from './load'

const body = { version: 'v1', builtAt: '2026-01-01', entries: [] }
const okResponse = (json: unknown = body) =>
  ({ ok: true, json: () => Promise.resolve(json) }) as Response

beforeEach(() => resetReferenceForTests())

test('two calls trigger one fetch and share the index', async () => {
  const fetchFn = vi.fn().mockResolvedValue(okResponse())
  const [a, b] = await Promise.all([loadReference(fetchFn), loadReference(fetchFn)])
  expect(fetchFn).toHaveBeenCalledTimes(1)
  expect(fetchFn).toHaveBeenCalledWith('/reference.json')
  expect(a).toBe(b)
  expect(a.version).toBe('v1')
  await loadReference(fetchFn)
  expect(fetchFn).toHaveBeenCalledTimes(1)
})

test('a failed attempt is not memoised', async () => {
  const fetchFn = vi
    .fn()
    .mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValueOnce(okResponse())
  await expect(loadReference(fetchFn)).rejects.toThrow('offline')
  await expect(loadReference(fetchFn)).resolves.toMatchObject({ version: 'v1' })
  expect(fetchFn).toHaveBeenCalledTimes(2)
})

test('a non-OK response rejects', async () => {
  const fetchFn = vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response)
  await expect(loadReference(fetchFn)).rejects.toThrow(/404/)
})

test('invalid JSON rejects', async () => {
  const fetchFn = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.reject(new SyntaxError('bad json')),
  } as Response)
  await expect(loadReference(fetchFn)).rejects.toThrow()
})

test('JSON lacking version or entries rejects', async () => {
  await expect(loadReference(vi.fn().mockResolvedValue(okResponse({ entries: [] })))).rejects.toThrow()
  resetReferenceForTests()
  await expect(loadReference(vi.fn().mockResolvedValue(okResponse({ version: 'v' })))).rejects.toThrow()
})

const tagged = (etag: string, json: unknown = body) =>
  ({ ok: true, headers: new Headers({ etag }), json: vi.fn(() => Promise.resolve(json)) }) as unknown as Response

test('refresh asks the server to revalidate and skips parsing when the fingerprint is unchanged', async () => {
  const first = tagged('"a"')
  await loadReference(vi.fn().mockResolvedValue(first))
  const same = tagged('"a"')
  const fetchFn = vi.fn().mockResolvedValue(same)
  await expect(refreshReference(fetchFn)).resolves.toBeNull()
  expect(fetchFn).toHaveBeenCalledWith('/reference.json', { cache: 'no-cache' })
  expect(same.json).not.toHaveBeenCalled()
})

test('refresh returns the new index when the fingerprint changed, and later loads share it', async () => {
  await loadReference(vi.fn().mockResolvedValue(tagged('"a"')))
  const fresh = await refreshReference(vi.fn().mockResolvedValue(tagged('"b"', { ...body, version: 'v2' })))
  expect(fresh?.version).toBe('v2')
  const unused = vi.fn()
  await expect(loadReference(unused)).resolves.toBe(fresh)
  expect(unused).not.toHaveBeenCalled()
})

test('refresh never throws: offline or a bad response gives null', async () => {
  await expect(refreshReference(vi.fn().mockRejectedValue(new Error('offline')))).resolves.toBeNull()
  await expect(refreshReference(vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response))).resolves.toBeNull()
})
