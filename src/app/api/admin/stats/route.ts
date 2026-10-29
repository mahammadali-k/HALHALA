import { stats } from '@/server/admin'
import { json, route } from '@/server/http'

export const dynamic = 'force-dynamic'

export const GET = route((req) => json(stats(req)))
