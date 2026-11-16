import type { Hazard } from '../reference/types'

export type ProductType = 'food' | 'cosmetic'

export interface NewProduct {
  name: string
  brand: string
  type: ProductType
  barcode: string | null
  ingredients: string[]
  /** Which reference the user saw when saving. Verdicts themselves are never stored. */
  referenceVersion: string
  /** True when the names were picked out of a product description, so the check is partial. */
  fromDescription?: boolean
  /** Allergen groups from the label's "may contain" warning (e.g. "Peanuts"); not ingredients. */
  mayContain?: string[]
  /** Extra checks the person turned on for this product (cancer is always checked). */
  checks?: Hazard[]
}

export interface ProductRecord extends NewProduct {
  id: string
  createdAt: string
}

// Storage boundary: swappable for a server-backed implementation.
export interface ProductStore {
  findMatches(p: NewProduct): Promise<ProductRecord[]>
  save(p: NewProduct): Promise<ProductRecord>
  get(id: string): Promise<ProductRecord | null>
  /** Removes the product and its scan history row from this device. */
  delete(id: string): Promise<void>
  /** Saves which extra checks are on for a product. */
  setChecks(id: string, checks: Hazard[]): Promise<void>
  search(text: string): Promise<ProductRecord[]>
}
