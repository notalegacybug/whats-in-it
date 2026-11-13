import { createContext, useContext } from 'react'
import type { ProductStore } from '../products/types'

export const StoreContext = createContext<ProductStore | null>(null)

export function useProductStore(): ProductStore {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useProductStore must be used inside a StoreContext provider')
  return store
}
