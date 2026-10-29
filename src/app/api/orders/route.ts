import { json, route } from '@/server/http'
import { createOrder } from '@/server/orders'

export const POST = route(async (req) => json(await createOrder(req), 201))
