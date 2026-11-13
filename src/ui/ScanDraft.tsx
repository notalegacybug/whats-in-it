import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export interface ScanDraft {
  ingredients: string[]
  /** Names were picked out of a description rather than read from a list. */
  fromDescription: boolean
  setIngredients(v: string[], fromDescription?: boolean): void
  clear(): void
}

const ScanDraftContext = createContext<ScanDraft | null>(null)

// Held in memory only: nothing is persisted until the person saves a product.
export function ScanDraftProvider({ children, initial = [] }: { children: ReactNode; initial?: string[] }) {
  const [ingredients, setList] = useState<string[]>(initial)
  const [fromDescription, setFromDescription] = useState(false)
  // Editing rows keeps the flag; only a new read (paste, photo) sets it.
  const setIngredients = useCallback((v: string[], description?: boolean) => {
    setList(v)
    if (description !== undefined) setFromDescription(description)
  }, [])
  const clear = useCallback(() => {
    setList([])
    setFromDescription(false)
  }, [])
  const value = useMemo(
    () => ({ ingredients, fromDescription, setIngredients, clear }),
    [ingredients, fromDescription, setIngredients, clear],
  )
  return <ScanDraftContext.Provider value={value}>{children}</ScanDraftContext.Provider>
}

export function useScanDraft(): ScanDraft {
  const draft = useContext(ScanDraftContext)
  if (!draft) throw new Error('useScanDraft must be used inside <ScanDraftProvider>')
  return draft
}
