'use client'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { api } from '@/lib/api'
import { channelsOf, type Channel } from '@/lib/store'
import type { Product } from '@/types'
import type { Config, LiveCatalog, StoreSettings } from '@/types/api'

interface Ctx {
  /** Active products with live stock and prices (rendered on the server, refreshed after orders / admin changes). */
  products: Product[]
  /** Admin-editable store settings: contacts, social links, delivery fee, policy texts. */
  store: StoreSettings
  /** Instagram (+ TikTok when set) message channels derived from the store settings. */
  channels: Channel[]
  config: Config
  getProduct: (id: string) => Product | undefined
  getBySlug: (slug: string) => Product | undefined
  /** Apply the catalogue snapshot returned by any API response. */
  applyCatalog: (c: LiveCatalog) => void
  applyStore: (s: StoreSettings) => void
  refresh: () => Promise<void>
}
const C = createContext<Ctx | null>(null)

/** Server-rendered initial state → no loading flash. */
export function CatalogProvider({ initial, initialStore, config, children }: { initial: LiveCatalog; initialStore: StoreSettings; config: Config; children: ReactNode }) {
  const [products, setProducts] = useState(initial.products)
  const [store, setStore] = useState(initialStore)
  const applyCatalog = useCallback((c: LiveCatalog) => setProducts(c.products), [])
  const refresh = useCallback(async () => { try { setProducts((await api<LiveCatalog>('/api/products')).products) } catch { /* keep last known state */ } }, [])

  const value = useMemo<Ctx>(() => ({
    products, store, config, applyCatalog, applyStore: setStore, refresh, channels: channelsOf(store),
    getProduct: (id) => products.find((p) => p.id === id),
    getBySlug: (slug) => products.find((p) => p.slug === slug),
  }), [products, store, config, applyCatalog, refresh])
  return <C.Provider value={value}>{children}</C.Provider>
}

export function useCatalog() {
  const c = useContext(C)
  if (!c) throw new Error('useCatalog must be used inside <CatalogProvider>')
  return c
}
