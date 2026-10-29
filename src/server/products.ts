import 'server-only'
import { randomBytes } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { NextRequest } from 'next/server'
import sharp, { type Metadata, type Sharp } from 'sharp'
import { clean } from '@/lib/validate'
import { CATEGORIES, SIZES, type Category, type Product, type Size } from '@/types'
import { requireAdmin } from './auth'
import { listProducts, toQepik } from './catalog'
import { many, one, run, tx } from './db'
import { ApiError, readJson } from './http'

/** Admin-side catalogue management: products, stock per size, and photo upload (resized + converted to WebP). */
export const UPLOAD_WIDTHS = [480, 800, 1200, 1600] as const
const MAX_UPLOAD = 15 * 1024 * 1024
export const uploadsDir = () => path.join(process.env.DATA_DIR || path.join(process.cwd(), 'data'), 'uploads')

const adminProduct = (id: string) => listProducts({ all: true }).find((p) => p.id === id)
const mustFind = (id: string) => { const p = adminProduct(id); if (!p) throw new ApiError(404, 'not_found'); return p }

/** "Kechi Ferrari" → "kechi-ferrari" (Azerbaijani letters transliterated). */
export function slugify(name: string) {
  const map: Record<string, string> = { ə: 'e', Ə: 'e', ı: 'i', İ: 'i', ö: 'o', Ö: 'o', ü: 'u', Ü: 'u', ş: 's', Ş: 's', ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g' }
  return name.replace(/[əƏıİöÖüÜşŞçÇğĞ]/g, (c) => map[c]).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'product'
}
function uniqueSlug(base: string, exceptId?: string) {
  for (let i = 1; i < 100; i++) {
    const slug = i === 1 ? base : `${base}-${i}`
    const hit = one<{ id: string }>('SELECT id FROM products WHERE slug = ?', slug)
    if (!hit || hit.id === exceptId) return slug
  }
  throw new ApiError(409, 'invalid_input', { fields: { slug: 'taken' } })
}

interface ProductInput {
  name?: unknown; slug?: unknown; category?: unknown; price?: unknown; bestSeller?: unknown; active?: unknown
  description?: Record<string, unknown>; stock?: Record<string, unknown>
}

/** Validates the (partial) product payload; `full` = create (name, category, price and at least one size are required). */
function parse(b: ProductInput, full: boolean) {
  const fields: Record<string, string> = {}
  const out: { name?: string; slug?: string; category?: Category; priceQ?: number; bestSeller?: boolean; active?: boolean; desc?: Record<'en' | 'az' | 'ru', string>; stock?: Partial<Record<Size, number>> } = {}
  if (b.name !== undefined || full) { const n = clean(b.name, 80); if (n.length < 2) fields.name = 'name'; else out.name = n }
  if (b.slug !== undefined && clean(b.slug, 60)) { const s = slugify(clean(b.slug, 60)); out.slug = s }
  if (b.category !== undefined || full) { if (!CATEGORIES.includes(b.category as Category)) fields.category = 'category'; else out.category = b.category as Category }
  if (b.price !== undefined || full) { const p = Number(b.price); if (!Number.isFinite(p) || p <= 0 || p > 100000) fields.price = 'price'; else out.priceQ = toQepik(p) }
  if (b.bestSeller !== undefined) out.bestSeller = Boolean(b.bestSeller)
  if (b.active !== undefined) out.active = Boolean(b.active)
  if (b.description) out.desc = { en: clean(b.description.en, 2000), az: clean(b.description.az, 2000), ru: clean(b.description.ru, 2000) }
  if (b.stock !== undefined || full) {
    const stock: Partial<Record<Size, number>> = {}
    for (const [size, q] of Object.entries(b.stock ?? {})) {
      const qty = Number(q)
      if (!SIZES.includes(size as Size) || !Number.isInteger(qty) || qty < 0 || qty > 100000) { fields.stock = 'stock'; break }
      stock[size as Size] = qty
    }
    if (!Object.keys(stock).length) fields.stock = 'stock'
    out.stock = stock
  }
  if (Object.keys(fields).length) throw new ApiError(400, 'invalid_input', { fields })
  return out
}

function writeStock(id: string, stock: Partial<Record<Size, number>>) {
  const sizes = Object.keys(stock)
  run(`DELETE FROM stock WHERE product_id = ? AND size NOT IN (${sizes.map(() => '?').join(',')})`, id, ...sizes)
  for (const [size, qty] of Object.entries(stock)) run('INSERT INTO stock (product_id, size, qty) VALUES (?, ?, ?) ON CONFLICT(product_id, size) DO UPDATE SET qty = excluded.qty', id, size, qty)
}

export function adminListProducts(req: NextRequest): Product[] { requireAdmin(req); return listProducts({ all: true }) }

export async function createProduct(req: NextRequest): Promise<Product> {
  requireAdmin(req)
  const v = parse(await readJson<ProductInput>(req), true)
  const id = `p${randomBytes(4).toString('hex')}`
  tx(() => {
    run(`INSERT INTO products (id, slug, name, category, price_q, best_seller, active, desc_en, desc_az, desc_ru) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, uniqueSlug(v.slug ?? slugify(v.name!)), v.name!, v.category!, v.priceQ!, v.bestSeller ? 1 : 0, v.active ? 1 : 0, v.desc?.en ?? '', v.desc?.az ?? '', v.desc?.ru ?? '')
    writeStock(id, v.stock!)
  })
  return mustFind(id)
}

export async function updateProduct(req: NextRequest, id: string): Promise<Product> {
  requireAdmin(req)
  mustFind(id)
  const v = parse(await readJson<ProductInput>(req), false)
  tx(() => {
    if (v.name !== undefined) run('UPDATE products SET name = ? WHERE id = ?', v.name, id)
    if (v.slug !== undefined) run('UPDATE products SET slug = ? WHERE id = ?', uniqueSlug(v.slug, id), id)
    if (v.category !== undefined) run('UPDATE products SET category = ? WHERE id = ?', v.category, id)
    if (v.priceQ !== undefined) run('UPDATE products SET price_q = ? WHERE id = ?', v.priceQ, id)
    if (v.bestSeller !== undefined) run('UPDATE products SET best_seller = ? WHERE id = ?', v.bestSeller ? 1 : 0, id)
    if (v.active !== undefined) run('UPDATE products SET active = ? WHERE id = ?', v.active ? 1 : 0, id)
    if (v.desc) run('UPDATE products SET desc_en = ?, desc_az = ?, desc_ru = ? WHERE id = ?', v.desc.en, v.desc.az, v.desc.ru, id)
    if (v.stock) writeStock(id, v.stock)
  })
  return mustFind(id)
}

/** Products that were ever ordered cannot be deleted (order history keeps their names) — deactivate them instead. */
export async function deleteProduct(req: NextRequest, id: string) {
  requireAdmin(req)
  const p = mustFind(id)
  if (one('SELECT 1 FROM order_items WHERE product_id = ? LIMIT 1', id)) throw new ApiError(409, 'has_orders')
  for (const img of p.images) await removeFiles(img.src)
  tx(() => { run('DELETE FROM stock WHERE product_id = ?', id); run('DELETE FROM products WHERE id = ?', id) }) // images cascade
}

// ---------------------------------------------------------------- photos
async function removeFiles(base?: string) {
  if (!base?.startsWith('/uploads/')) return // seeded photos are part of the app (public/images), never deleted here
  await Promise.all(UPLOAD_WIDTHS.map((w) => unlink(path.join(uploadsDir(), `${path.basename(base)}-${w}.webp`)).catch(() => {})))
}

/** multipart/form-data with a `file` field → 4 WebP sizes on disk + a blur placeholder in the database. */
export async function uploadImage(req: NextRequest, id: string): Promise<Product> {
  requireAdmin(req)
  mustFind(id)
  if (Number(req.headers.get('content-length')) > MAX_UPLOAD + 1024 * 1024) throw new ApiError(413, 'too_large')
  const file = (await req.formData()).get('file')
  if (!(file instanceof File) || file.size === 0) throw new ApiError(400, 'invalid_input')
  if (file.size > MAX_UPLOAD) throw new ApiError(413, 'too_large')

  const input = Buffer.from(await file.arrayBuffer())
  let img: Sharp, meta: Metadata
  try { img = sharp(input, { limitInputPixels: 100e6 }).rotate(); meta = await sharp(input).metadata() } catch { throw new ApiError(415, 'unsupported_image') }
  if (!meta.width || !meta.height || !['jpeg', 'png', 'webp', 'heif', 'avif', 'tiff'].includes(meta.format ?? '')) throw new ApiError(415, 'unsupported_image')
  const [w, h] = (meta.orientation ?? 1) >= 5 ? [meta.height, meta.width] : [meta.width, meta.height]

  const name = `u${randomBytes(8).toString('hex')}`
  await mkdir(uploadsDir(), { recursive: true })
  for (const width of UPLOAD_WIDTHS) await writeFile(path.join(uploadsDir(), `${name}-${width}.webp`), await img.clone().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer())
  const blur = `data:image/webp;base64,${(await img.clone().resize({ width: 12 }).webp({ quality: 30 }).toBuffer()).toString('base64')}`
  const pos = (one<{ n: number }>('SELECT COALESCE(MAX(position), -1) + 1 AS n FROM product_images WHERE product_id = ?', id)?.n) ?? 0
  run('INSERT INTO product_images (product_id, base, width, height, blur, alt, position) VALUES (?, ?, ?, ?, ?, ?, ?)', id, `/uploads/${name}`, w, h, blur, '', pos)
  return mustFind(id)
}

export async function patchImage(req: NextRequest, id: string, imageId: number): Promise<Product> {
  requireAdmin(req)
  mustFind(id)
  const b = await readJson<{ alt?: unknown; move?: unknown }>(req)
  if (!one('SELECT 1 FROM product_images WHERE id = ? AND product_id = ?', imageId, id)) throw new ApiError(404, 'not_found')
  if (b.alt !== undefined) run('UPDATE product_images SET alt = ? WHERE id = ?', clean(b.alt, 200), imageId)
  if (b.move === 'up' || b.move === 'down' || b.move === 'first') {
    const ids = many<{ id: number }>('SELECT id FROM product_images WHERE product_id = ? ORDER BY position, id', id).map((r) => r.id)
    const i = ids.indexOf(imageId)
    const j = b.move === 'first' ? 0 : b.move === 'up' ? Math.max(0, i - 1) : Math.min(ids.length - 1, i + 1)
    ids.splice(i, 1); ids.splice(j, 0, imageId)
    tx(() => ids.forEach((iid, pos) => run('UPDATE product_images SET position = ? WHERE id = ?', pos, iid)))
  }
  return mustFind(id)
}

export async function removeImage(req: NextRequest, id: string, imageId: number): Promise<Product> {
  requireAdmin(req)
  mustFind(id)
  const row = one<{ base: string }>('SELECT base FROM product_images WHERE id = ? AND product_id = ?', imageId, id)
  if (!row) throw new ApiError(404, 'not_found')
  run('DELETE FROM product_images WHERE id = ?', imageId)
  await removeFiles(row.base)
  return mustFind(id)
}
