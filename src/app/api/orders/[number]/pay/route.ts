import { json, route } from '@/server/http'
import { payAgain } from '@/server/orders'

export const POST = route<{ number: string }>(async (req, { number }) => json({ paymentUrl: await payAgain(req, number) }))
