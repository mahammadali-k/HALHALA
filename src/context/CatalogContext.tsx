'use client'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { products as baseProducts } from '@/data/products'
import { api } from '@/lib/api'
import type { Product } from '@/types'
import type { Config, LiveCatalog } from '@/types/api'

interface Ctx {
  /** Static catalogue merged with the server's live stock and admin price overrides. Always use these, never data/products directly. */
  products: Product[]
  config: Config
  getProduct: (id: string) => Product | undefined
  getBySlug: (slug: string) => Product | undefined
  /** Apply live stock/prices returned by any API response. */
  applyCatalog: (c: Partial<LiveCatalog>) => void
  refresh: () => Promise<void>
}
const C = createContext<Ctx | null>(null)

/** Server-rendered initial state → no loading flash; later updates come from order / admin API responses. */
export function CatalogProvider({ initial, config, children }: { initial: LiveCatalog; config: Config; children: ReactNode }) {
  const [live, setLive] = useState(initial)
  const applyCatalog = useCallback((c: Partial<LiveCatalog>) => setLive((cur) => ({ stock: c.stock ?? cur.stock, prices: c.prices ?? cur.prices })), [])
  const refresh = useCallback(async () => { try { setLive(await api<LiveCatalog>('/api/stock')) } catch { /* keep last known state */ } }, [])

  const products = useMemo(() => baseProducts.map((p) => ({ ...p, price: live.prices[p.id] ?? p.price, stock: live.stock[p.id] ?? p.stock })), [live])
  const value = useMemo(() => ({
    products, config, applyCatalog, refresh,
    getProduct: (id: string) => products.find((p) => p.id === id),
    getBySlug: (slug: string) => products.find((p) => p.slug === slug),
  }), [products, config, applyCatalog, refresh])
  return <C.Provider value={value}>{children}</C.Provider>
}

export function useCatalog() {
  const c = useContext(C)
  if (!c) throw new Error('useCatalog must be used inside <CatalogProvider>')
  return c
}
