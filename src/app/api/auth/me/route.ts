import { getSessionUser, updateProfile } from '@/server/auth'
import { json, route } from '@/server/http'

export const dynamic = 'force-dynamic'

export const GET = route(async () => json({ user: await getSessionUser() }))
export const PATCH = route(async (req) => json({ user: await updateProfile(req) }))
