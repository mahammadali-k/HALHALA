import { CATEGORIES, type Category, type LangId, type Product, type Size } from '@/types'
import { pickText } from './store'

/** Pure helpers over *live* products (the CatalogContext merges server stock/prices into the static catalogue). */
export const stockFor = (p: Product, size: Size) => p.stock[size] ?? 0
export const sizesOf = (p: Product) => Object.keys(p.stock) as Size[]
export const totalStock = (p: Product) => sizesOf(p).reduce((n, s) => n + stockFor(p, s), 0)
export const isSoldOut = (p: Product) => totalStock(p) === 0

/** Categories that currently have at least one product, in the canonical order. */
export const activeCategories = (all: Product[]): Category[] => CATEGORIES.filter((c) => all.some((p) => p.category === c))

export const related = (p: Product, all: Product[], n = 4) =>
  all.filter((x) => x.id !== p.id).sort((a, b) => Number(b.category === p.category) - Number(a.category === p.category)).slice(0, n)

/** Product description in the visitor's language (falls back to another language when it is missing). */
export const describe = (p: Product, lang: LangId) => pickText(p.description, lang)
