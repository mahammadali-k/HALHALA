import { requireAdmin } from '@/server/auth'
import { json, route } from '@/server/http'
import { getStore, updateStore } from '@/server/settings'

export const dynamic = 'force-dynamic'

export const GET = route((req) => { requireAdmin(req); return json({ store: getStore() }) })
export const PATCH = route(async (req) => json({ store: await updateStore(req) }))
