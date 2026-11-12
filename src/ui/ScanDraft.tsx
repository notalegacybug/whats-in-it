import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export interface ScanDraft {
  ingredients: string[]
  setIngredients(v: string[]): void
  clear(): void
}

const ScanDraftContext = createContext<ScanDraft | null>(null)

/**
 * The ingredient list being worked on between Capture, Review and Details. Held in memory only:
 * nothing is persisted until the person saves a product.
 */
export function ScanDraftProvider({ children, initial = [] }: { children: ReactNode; initial?: string[] }) {
  const [ingredients, setIngredients] = useState<string[]>(initial)
  const clear = useCallback(() => setIngredients([]), [])
  const value = useMemo(() => ({ ingredients, setIngredients, clear }), [ingredients, clear])
  return <ScanDraftContext.Provider value={value}>{children}</ScanDraftContext.Provider>
}

export function useScanDraft(): ScanDraft {
  const draft = useContext(ScanDraftContext)
  if (!draft) throw new Error('useScanDraft must be used inside <ScanDraftProvider>')
  return draft
}
