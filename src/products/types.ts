export type ProductType = 'food' | 'cosmetic'

export interface NewProduct {
  name: string
  brand: string
  type: ProductType
  barcode: string | null
  ingredients: string[]
  /** Which reference the user saw when saving. Verdicts themselves are never stored. */
  referenceVersion: string
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
  search(text: string): Promise<ProductRecord[]>
}
