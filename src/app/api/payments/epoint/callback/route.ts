import { readForm, route, text } from '@/server/http'
import { applyEpointCallback } from '@/server/orders'

// Server-to-server call from the payment gateway: no browser headers, authenticated by its signature instead of CSRF.
export const POST = route(async (req) => { applyEpointCallback(await readForm(req)); return text('ok') }, { csrf: false })
