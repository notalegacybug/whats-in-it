// Best-effort: Safari on iPhone can otherwise clear IndexedDB after a period without use.
export async function requestPersistentStorage(
  nav: Pick<Navigator, 'storage'> | undefined = globalThis.navigator,
): Promise<void> {
  try {
    await nav?.storage?.persist?.()
  } catch {
  }
}
