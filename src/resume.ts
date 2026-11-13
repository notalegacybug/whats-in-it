// Android often brings an installed web app back to the front without restarting it, so "on start" checks
// never run again. This fires when the page becomes visible, throttled so quick app switches stay free.
interface VisibilityDoc {
  visibilityState: DocumentVisibilityState
  addEventListener(type: 'visibilitychange', listener: () => void): void
  removeEventListener(type: 'visibilitychange', listener: () => void): void
}

export function onAppResume(
  callback: () => void,
  { doc = document as VisibilityDoc, now = Date.now, minIntervalMs = 5 * 60 * 1000 } = {},
): () => void {
  let last = -Infinity
  const handler = () => {
    if (doc.visibilityState !== 'visible' || now() - last < minIntervalMs) return
    last = now()
    callback()
  }
  doc.addEventListener('visibilitychange', handler)
  return () => doc.removeEventListener('visibilitychange', handler)
}
