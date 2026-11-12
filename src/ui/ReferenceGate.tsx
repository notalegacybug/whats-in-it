import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { loadReference } from '../reference/load'
import type { RefIndex } from '../reference'

export interface ReferenceState {
  status: 'loading' | 'ready' | 'error'
  index: RefIndex | null
  retry(): void
}

const ReferenceContext = createContext<ReferenceState | null>(null)

/** Read the loaded reference. Only valid under <ReferenceGate>, which loads it once. */
export function useReference(): ReferenceState {
  const state = useContext(ReferenceContext)
  if (!state) throw new Error('useReference must be used inside <ReferenceGate>')
  return state
}

/** Renders children only once the reference is loaded, so no result is ever shown without one. */
export function ReferenceGate({
  children,
  load = () => loadReference(),
}: {
  children: ReactNode
  load?: () => Promise<RefIndex>
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
