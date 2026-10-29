import { patchOrder } from '@/server/admin'
import { liveCatalog } from '@/server/catalog'
import { json, route } from '@/server/http'

export const PATCH = route<{ number: string }>(async (req, { number }) => json({ order: await patchOrder(req, number), ...liveCatalog() }))
