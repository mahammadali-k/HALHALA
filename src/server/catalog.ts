import 'server-only'
import type { Category, Described, ImageAsset, Product, Size } from '@/types'
import type { Config, LiveCatalog } from '@/types/api'
import { many } from './db'
import { paymentMethods } from './payments'
import { getStore } from './settings'

export const toQepik = (azn: number) => Math.round(azn * 100)
export const toAzn = (qepik: number) => qepik / 100

interface ProductDbRow { id: string; slug: string; name: string; category: string; price_q: number; best_seller: number; active: number; desc_en: string; desc_az: string; desc_ru: string; created_at: string }
interface ImageDbRow { id: number; product_id: string; base: string; width: number; height: number; blur: string; alt: string }

/** Products with their photos and live stock. Storefront = active only; admin passes { all: true }. */
export function listProducts(opts: { all?: boolean } = {}): Product[] {
  const rows = many<ProductDbRow>(`SELECT * FROM products ${opts.all ? '' : 'WHERE active = 1'} ORDER BY created_at DESC, rowid DESC`)
  const images = new Map<string, ImageAsset[]>()
  for (const r of many<ImageDbRow>('SELECT id, product_id, base, width, height, blur, alt FROM product_images ORDER BY product_id, position, id'))
    (images.get(r.product_id) ?? images.set(r.product_id, []).get(r.product_id)!).push({ id: r.id, src: r.base, width: r.width, height: r.height, blur: r.blur, alt: r.alt, label: r.alt })
  const stock = new Map<string, Partial<Record<Size, number>>>()
  for (const r of many<{ product_id: string; size: Size; qty: number }>('SELECT product_id, size, qty FROM stock'))
    (stock.get(r.product_id) ?? stock.set(r.product_id, {}).get(r.product_id)!)[r.size] = r.qty
  return rows.map((r): Product => ({
    id: r.id, slug: r.slug, name: r.name, category: r.category as Category, price: toAzn(r.price_q),
    description: { en: r.desc_en, az: r.desc_az, ru: r.desc_ru } satisfies Described,
    images: (images.get(r.id) ?? []).map((i) => ({ ...i, alt: i.alt || r.name, label: i.alt || r.name })),
    stock: stock.get(r.id) ?? {}, bestSeller: r.best_seller === 1, active: r.active === 1, createdAt: r.created_at,
  }))
}
export const liveCatalog = (): LiveCatalog => ({ products: listProducts() })
export const productBySlug = (slug: string) => listProducts().find((p) => p.slug === slug)

export const publicConfig = (): Config => ({ payments: paymentMethods(), currency: 'AZN' })

/** Delivery fee (qəpik) for a subtotal, from the admin-editable store settings. */
export function deliveryFeeQ(subtotalQ: number) {
  const { deliveryFee, freeDeliveryFrom } = getStore()
  return freeDeliveryFrom !== null && subtotalQ >= toQepik(freeDeliveryFrom) ? 0 : toQepik(deliveryFee)
}
