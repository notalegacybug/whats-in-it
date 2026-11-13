import { onAppResume } from './resume'

function fakeDoc() {
  const listeners: (() => void)[] = []
  const doc = {
    visibilityState: 'visible' as DocumentVisibilityState,
    addEventListener: (_: string, fn: () => void) => void listeners.push(fn),
    removeEventListener: (_: string, fn: () => void) => void listeners.splice(listeners.indexOf(fn), 1),
  }
  const show = () => {
    doc.visibilityState = 'visible'
    listeners.forEach((fn) => fn())
  }
  const hide = () => {
    doc.visibilityState = 'hidden'
    listeners.forEach((fn) => fn())
  }
  return { doc, show, hide, listeners }
}

test('calls back when the app comes back to the front, at most once per interval', () => {
  const { doc, show, hide } = fakeDoc()
  let t = 0
  const cb = vi.fn()
  onAppResume(cb, { doc, now: () => t, minIntervalMs: 1000 })
  hide()
  expect(cb).not.toHaveBeenCalled()
  show()
  expect(cb).toHaveBeenCalledTimes(1)
  t = 500
  show()
  expect(cb).toHaveBeenCalledTimes(1)
  t = 1600
  show()
  expect(cb).toHaveBeenCalledTimes(2)
})

test('the returned function stops listening', () => {
  const { doc, show, listeners } = fakeDoc()
  const cb = vi.fn()
  const stop = onAppResume(cb, { doc, now: () => 0, minIntervalMs: 0 })
  stop()
  show()
  expect(cb).not.toHaveBeenCalled()
  expect(listeners).toHaveLength(0)
})
