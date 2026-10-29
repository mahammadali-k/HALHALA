import { listUsers } from '@/server/admin'
import { json, route } from '@/server/http'

export const dynamic = 'force-dynamic'

export const GET = route((req) => json({ users: listUsers(req, new URL(req.url).searchParams.get('q') ?? '') }))
