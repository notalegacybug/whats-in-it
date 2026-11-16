import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { ProductType } from '../products/types'

/** Name, brand and type to pre-fill when editing a saved product. */
export interface DraftDetails {
  name: string
  brand: string
  type: ProductType
}

export interface ScanDraft {
  ingredients: string[]
  /** Names were picked out of a description rather than read from a list. */
  fromDescription: boolean
  details: DraftDetails | null
  setIngredients(v: string[], fromDescription?: boolean): void
  /** Starts an edit of a saved product. */
  load(ingredients: string[], fromDescription: boolean, details: DraftDetails): void
  clear(): void
}

const ScanDraftContext = createContext<ScanDraft | null>(null)

// Held in memory only: nothing is persisted until the person saves a product.
export function ScanDraftProvider({
  children,
  initial = [],
  initialDetails = null,
}: {
  children: ReactNode
  initial?: string[]
  initialDetails?: DraftDetails | null
}) {
  const [ingredients, setList] = useState<string[]>(initial)
  const [fromDescription, setFromDescription] = useState(false)
  const [details, setDetails] = useState<DraftDetails | null>(initialDetails)
  // Editing rows keeps the flag; only a new read (paste, photo) sets it.
  const setIngredients = useCallback((v: string[], description?: boolean) => {
    setList(v)
    if (description !== undefined) setFromDescription(description)
  }, [])
  const load = useCallback((v: string[], description: boolean, d: DraftDetails) => {
    setList(v)
    setFromDescription(description)
    setDetails(d)
  }, [])
  const clear = useCallback(() => {
    setList([])
    setFromDescription(false)
    setDetails(null)
  }, [])
  const value = useMemo(
    () => ({ ingredients, fromDescription, details, setIngredients, load, clear }),
    [ingredients, fromDescription, details, setIngredients, load, clear],
  )
  return <ScanDraftContext.Provider value={value}>{children}</ScanDraftContext.Provider>
}

export function useScanDraft(): ScanDraft {
  const draft = useContext(ScanDraftContext)
  if (!draft) throw new Error('useScanDraft must be used inside <ScanDraftProvider>')
  return draft
}
