import { patchImage, removeImage } from '@/server/products'
import { json, route } from '@/server/http'

export const PATCH = route<{ id: string; imageId: string }>(async (req, { id, imageId }) => json({ product: await patchImage(req, id, Number(imageId)) }))
export const DELETE = route<{ id: string; imageId: string }>(async (req, { id, imageId }) => json({ product: await removeImage(req, id, Number(imageId)) }))
