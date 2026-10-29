import 'server-only'
import catalog from '@/data/catalog.json'
import type { Size } from '@/types'
import type { Config, LiveCatalog, PriceMap, StockMap } from '@/types/api'
import { many } from './db'
import { paymentMethods } from './payments'

export const baseCatalog = catalog
export const baseById = new Map(catalog.map((p) => [p.id, p]))

export const toQepik = (azn: number) => Math.round(azn * 100)
export const toAzn = (qepik: number) => qepik / 100

/** Admin price overrides win over catalog.json. Prices are kept in qəpik (integers) while computing. */
export function priceQMap() {
  const m = new Map(catalog.map((p) => [p.id, toQepik(p.price)]))
  for (const r of many<{ product_id: string; price_q: number }>('SELECT product_id, price_q FROM price_overrides')) if (m.has(r.product_id)) m.set(r.product_id, r.price_q)
  return m
}
export const pricesAzn = (): PriceMap => Object.fromEntries([...priceQMap()].map(([id, q]) => [id, toAzn(q)]))

export function stockMap(): StockMap {
  const out: StockMap = {}
  for (const r of many<{ product_id: string; size: Size; qty: number }>('SELECT product_id, size, qty FROM stock')) (out[r.product_id] ??= {})[r.size] = r.qty
  return out
}
export const liveCatalog = (): LiveCatalog => ({ stock: stockMap(), prices: pricesAzn() })

export const publicConfig = (): Config => ({
  payments: paymentMethods(),
  currency: 'AZN',
  deliveryFee: Number(process.env.DELIVERY_FEE_AZN) || 0,
  freeDeliveryFrom: process.env.FREE_DELIVERY_FROM_AZN ? Number(process.env.FREE_DELIVERY_FROM_AZN) : null,
})

export function deliveryFeeQ(subtotalQ: number) {
  const fee = toQepik(Number(process.env.DELIVERY_FEE_AZN) || 0)
  const free = process.env.FREE_DELIVERY_FROM_AZN ? toQepik(Number(process.env.FREE_DELIVERY_FROM_AZN)) : null
  return free !== null && subtotalQ >= free ? 0 : fee
}
