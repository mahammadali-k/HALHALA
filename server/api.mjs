// Single entry point for every /api/* request (used by server/index.mjs and the Vite dev/preview plugin).
import { handleAuth } from './auth.mjs'
import { handleChat } from './chat.mjs'
import { ApiError, assertOriginIfPresent, assertSameOrigin, send } from './http.mjs'
import { handleOrders } from './orders.mjs'

export async function handleApi(req, res) {
  // Vite's connect middleware strips the mount path from req.url; originalUrl keeps it.
  const full = req.originalUrl ?? req.url ?? ''
  const path = full.split('?')[0]
  try {
    if (path.startsWith('/api/chat')) { assertOriginIfPresent(req); req.url = full; return await handleChat(req, res) }
    req.url = full
    // Gateway callbacks are server-to-server (no browser headers); they are authenticated by their signature instead.
    if (path !== '/api/payments/epoint/callback') assertSameOrigin(req)
    if (path.startsWith('/api/auth/')) return await handleAuth(req, res, path)
    return await handleOrders(req, res, path)
  } catch (e) {
    if (e instanceof ApiError) return send(res, e.status, { error: e.code, ...(e.extra ?? {}) })
    console.error('[api]', e)
    return send(res, 500, { error: 'server' })
  }
}
