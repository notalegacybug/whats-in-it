import { requestPersistentStorage } from './persist'

type Nav = Parameters<typeof requestPersistentStorage>[0]

test('asks the browser to keep saved data when it can', async () => {
  const persist = vi.fn().mockResolvedValue(true)
  await requestPersistentStorage({ storage: { persist } } as unknown as Nav)
  expect(persist).toHaveBeenCalledTimes(1)
})

test('a browser without the storage API or persist() is fine', async () => {
  await expect(requestPersistentStorage({} as Nav)).resolves.toBeUndefined()
  await expect(requestPersistentStorage({ storage: {} } as unknown as Nav)).resolves.toBeUndefined()
  await expect(requestPersistentStorage(undefined)).resolves.toBeUndefined()
})

test('a refusal or error from persist() is swallowed', async () => {
  const rejecting = { storage: { persist: vi.fn().mockRejectedValue(new Error('denied')) } } as unknown as Nav
  await expect(requestPersistentStorage(rejecting)).resolves.toBeUndefined()
  const throwing = { storage: { persist: () => { throw new Error('sync') } } } as unknown as Nav
  await expect(requestPersistentStorage(throwing)).resolves.toBeUndefined()
})
