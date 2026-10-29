import { json, route } from '@/server/http'
import { lookupOrder } from '@/server/orders'

export const dynamic = 'force-dynamic'

export const GET = route<{ number: string }>(async (req, { number }) => json({ order: await lookupOrder(req, number, new URL(req.url).searchParams.get('t')) }))
