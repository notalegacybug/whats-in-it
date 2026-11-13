import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { loadReference, refreshReference } from '../reference/load'
import { onAppResume } from '../resume'
import type { RefIndex } from '../reference'

export interface ReferenceState {
  status: 'loading' | 'ready' | 'error'
  index: RefIndex | null
  retry(): void
}

const ReferenceContext = createContext<ReferenceState | null>(null)

// Only valid under <ReferenceGate>.
export function useReference(): ReferenceState {
  const state = useContext(ReferenceContext)
  if (!state) throw new Error('useReference must be used inside <ReferenceGate>')
  return state
}

export function ReferenceGate({
  children,
  load = () => loadReference(),
  refresh = () => refreshReference(),
  watchResume = onAppResume,
}: {
  children: ReactNode
  load?: () => Promise<RefIndex>
  refresh?: () => Promise<RefIndex | null>
  watchResume?: (callback: () => void) => () => void
}) {
  const [index, setIndex] = useState<RefIndex | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let live = true // guards against setting state after unmount or a superseded attempt
    load().then(
      (i) => live && setIndex(i),
      () => live && setFailed(true),
    )
    return () => {
      live = false
    }
    // `load` is deliberately omitted: an inline loader must not re-trigger loading each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt])

  // Swap in a changed reference when the app comes back to the front; results re-check against it.
  useEffect(
    () =>
      watchResume(() => {
        refresh().then((fresh) => {
          if (fresh) setIndex((current) => (current && current.version === fresh.version ? current : fresh))
        })
      }),
    // Same reasoning as `load` above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const retry = useCallback(() => {
    setFailed(false)
    setAttempt((n) => n + 1)
  }, [])

  const status = index ? 'ready' : failed ? 'error' : 'loading'

  if (status === 'loading') return <p role="status">Loading ingredient reference…</p>
  if (status === 'error') {
    return (
      <div role="alert">
        <p>Couldn't load the ingredient reference.</p>
        <button type="button" onClick={retry}>
          Try again
        </button>
      </div>
    )
  }
  return <ReferenceContext.Provider value={{ status, index, retry }}>{children}</ReferenceContext.Provider>
}
