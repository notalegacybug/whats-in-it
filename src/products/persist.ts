/**
 * Asks the browser not to evict this app's saved products under storage pressure. Safari on iPhone can
 * otherwise clear site data, including IndexedDB, after a period without use. Best-effort: a browser
 * without the API, or one that refuses, leaves things as they were and never breaks start-up.
 */
export async function requestPersistentStorage(
  nav: Pick<Navigator, 'storage'> | undefined = globalThis.navigator,
): Promise<void> {
  try {
    await nav?.storage?.persist?.()
  } catch {
    // Refused or unsupported: nothing to do.
  }
}
