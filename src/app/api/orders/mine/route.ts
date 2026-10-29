import { json, route } from '@/server/http'
import { myOrders } from '@/server/orders'

export const dynamic = 'force-dynamic'

export const GET = route((req) => json({ orders: myOrders(req) }))
