import { products } from '../data/products'
import type { Product, Size } from '../types'

export const getProductById = (id: string) => products.find((p) => p.id === id)
export const getProductBySlug = (slug: string) => products.find((p) => p.slug === slug)

/**
 * Live stock reported by the server overrides the catalogue's initial numbers.
 * (Module-level store + a version counter in CatalogContext re-renders whoever shows stock.)
 */
let live: Record<string, Partial<Record<Size, number>>> | null = null
export function setLiveCatalog(stock: Record<string, Partial<Record<Size, number>>>, prices?: Record<string, number>) {
  live = stock
  if (prices) for (const p of products) if (prices[p.id] !== undefined) p.price = prices[p.id] // admin price overrides
}

export const stockFor = (p: Product, size: Size) => (live?.[p.id] ?? p.stock)[size] ?? 0
const sizesOf = (p: Product) => Object.keys(p.stock) as Size[]
export const totalStock = (p: Product) => sizesOf(p).reduce((n, s) => n + stockFor(p, s), 0)
export const availableSizes = (p: Product) => sizesOf(p)
export const isSoldOut = (p: Product) => totalStock(p) === 0

export const related = (p: Product, n = 4) =>
  products
    .filter((x) => x.id !== p.id)
    .sort((a, b) => Number(b.category === p.category) - Number(a.category === p.category))
    .slice(0, n)
