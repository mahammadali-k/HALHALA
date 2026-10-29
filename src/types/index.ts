export type Size = 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'One Size'
export const SIZES: Size[] = ['S', 'M', 'L', 'XL', 'XXL', 'One Size']

export type Category = 'T-Shirts' | 'Hoodies' | 'Accessories'
export const CATEGORIES: Category[] = ['T-Shirts', 'Hoodies', 'Accessories']

export interface ImageAsset {
  /** Database id of an uploaded/seeded product image (admin editing only). */
  id?: number
  /** Base path of an optimised photo, e.g. "/images/laundry-side" (files `-480/-800/-1200/-1600.webp` sit next to it). Leave undefined for a labelled placeholder. */
  src?: string
  width?: number
  height?: number
  /** Tiny inline placeholder shown while the real image loads. */
  blur?: string
  /** CSS object-position to keep the subject framed when cropped. */
  pos?: string
  alt: string
  /** Text shown on the placeholder when `src` is missing. */
  label: string
}

export type LangId = 'az' | 'ru' | 'en'

/** One description per language (the storefront falls back to another language when one is missing). */
export type Described = Partial<Record<LangId, string>>

export interface Product {
  id: string
  slug: string
  name: string
  category: Category
  /** Price in AZN, whole manats or decimals. */
  price: number
  description: Described
  images: ImageAsset[]
  /** Units in stock per size. A size that is listed is sellable; 0 = sold out. */
  stock: Partial<Record<Size, number>>
  bestSeller?: boolean
  /** Inactive products are hidden from the storefront (and cannot be ordered). */
  active: boolean
  createdAt: string
  /** Optional turntable frames (ordered, one full revolution) for a true 360° view. Without them a two-face front/back spin is used. */
  spin?: string[]
}

export interface CartItem {
  productId: string
  size: Size
  quantity: number
}
