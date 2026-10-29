import { deleteProduct, updateProduct } from '@/server/products'
import { json, route } from '@/server/http'

export const PATCH = route<{ id: string }>(async (req, { id }) => json({ product: await updateProduct(req, id) }))
export const DELETE = route<{ id: string }>(async (req, { id }) => { await deleteProduct(req, id); return json({ ok: true }) })
