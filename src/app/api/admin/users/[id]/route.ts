import { setRole } from '@/server/admin'
import { json, route } from '@/server/http'

export const PATCH = route<{ id: string }>(async (req, { id }) => json({ users: await setRole(req, Number(id)) }))
