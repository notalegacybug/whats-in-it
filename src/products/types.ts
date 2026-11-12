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

/** Storage boundary: the on-device implementation is swappable for a server-backed one. */
export interface ProductStore {
  findMatches(p: NewProduct): Promise<ProductRecord[]>
  save(p: NewProduct): Promise<ProductRecord>
  get(id: string): Promise<ProductRecord | null>
  /** Name or brand contains text, case-insensitive, newest first. */
  search(text: string): Promise<ProductRecord[]>
}
