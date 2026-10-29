import { liveCatalog } from '@/server/catalog'
import { json, route } from '@/server/http'
import { cancelOwnOrder } from '@/server/orders'

export const POST = route<{ number: string }>(async (req, { number }) => json({ order: await cancelOwnOrder(req, number), ...liveCatalog() }))
