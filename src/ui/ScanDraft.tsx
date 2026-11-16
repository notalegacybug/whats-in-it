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
  /** Allergen groups from the label's "may contain" warning. */
  mayContain: string[]
  details: DraftDetails | null
  setIngredients(v: string[], fromDescription?: boolean): void
  setMayContain(groups: string[]): void
  /** Starts an edit of a saved product. */
  load(ingredients: string[], fromDescription: boolean, details: DraftDetails, mayContain?: string[]): void
  clear(): void
}

const ScanDraftContext = createContext<ScanDraft | null>(null)

// Held in memory only: nothing is persisted until the person saves a product.
export function ScanDraftProvider({
  children,
  initial = [],
  initialDetails = null,
  initialMayContain = [],
}: {
  children: ReactNode
  initial?: string[]
  initialDetails?: DraftDetails | null
  initialMayContain?: string[]
}) {
  const [ingredients, setList] = useState<string[]>(initial)
  const [fromDescription, setFromDescription] = useState(false)
  const [mayContain, setMayContain] = useState<string[]>(initialMayContain)
  const [details, setDetails] = useState<DraftDetails | null>(initialDetails)
  // Editing rows keeps the flag; only a new read (paste, photo) sets it.
  const setIngredients = useCallback((v: string[], description?: boolean) => {
    setList(v)
    if (description !== undefined) setFromDescription(description)
  }, [])
  const load = useCallback((v: string[], description: boolean, d: DraftDetails, may: string[] = []) => {
    setList(v)
    setFromDescription(description)
    setDetails(d)
    setMayContain(may)
  }, [])
  const clear = useCallback(() => {
    setList([])
    setFromDescription(false)
    setMayContain([])
    setDetails(null)
  }, [])
  const value = useMemo(
    () => ({ ingredients, fromDescription, mayContain, details, setIngredients, setMayContain, load, clear }),
    [ingredients, fromDescription, mayContain, details, setIngredients, load, clear],
  )
  return <ScanDraftContext.Provider value={value}>{children}</ScanDraftContext.Provider>
}

export function useScanDraft(): ScanDraft {
  const draft = useContext(ScanDraftContext)
  if (!draft) throw new Error('useScanDraft must be used inside <ScanDraftProvider>')
  return draft
}
