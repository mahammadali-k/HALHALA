import type { Product, Size } from '@/types'

/** Pure helpers over *live* products (the CatalogContext merges server stock/prices into the static catalogue). */
export const stockFor = (p: Product, size: Size) => p.stock[size] ?? 0
export const sizesOf = (p: Product) => Object.keys(p.stock) as Size[]
export const totalStock = (p: Product) => sizesOf(p).reduce((n, s) => n + stockFor(p, s), 0)
export const isSoldOut = (p: Product) => totalStock(p) === 0

export const related = (p: Product, all: Product[], n = 4) =>
  all.filter((x) => x.id !== p.id).sort((a, b) => Number(b.category === p.category) - Number(a.category === p.category)).slice(0, n)
