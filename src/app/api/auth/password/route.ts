import { changePassword } from '@/server/auth'
import { json, route } from '@/server/http'

export const POST = route(async (req) => { await changePassword(req); return json({ ok: true }) })
