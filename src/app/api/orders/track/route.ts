import { json, route } from '@/server/http'
import { trackOrder } from '@/server/orders'

export const POST = route(async (req) => json({ order: await trackOrder(req) }))
