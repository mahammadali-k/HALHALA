export type Size = 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'One Size'
export const SIZES: Size[] = ['S', 'M', 'L', 'XL', 'XXL', 'One Size']

export type Category = 'T-Shirts' | 'Hoodies' | 'Accessories'

export interface ImageAsset {
  /** Public URL / import path. Leave undefined to render a labelled placeholder. */
  src?: string
  /** Responsive candidates, e.g. "/images/a-480.webp 480w, …" */
  srcSet?: string
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

export interface Product {
  id: string
  slug: string
  name: string
  category: Category
  collectionId: string
  /** Price in AZN, whole manats or decimals. */
  price: number
  images: ImageAsset[]
  /** Units in stock per size. 0 / missing = unavailable. */
  stock: Partial<Record<Size, number>>
  bestSeller?: boolean
  createdAt: string
}

export interface Collection {
  id: string
  image: ImageAsset
}

export interface CartItem {
  productId: string
  size: Size
  quantity: number
}
