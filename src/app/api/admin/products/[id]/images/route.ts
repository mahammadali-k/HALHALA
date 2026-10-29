import { uploadImage } from '@/server/products'
import { json, route } from '@/server/http'

export const POST = route<{ id: string }>(async (req, { id }) => json({ product: await uploadImage(req, id) }, 201))
