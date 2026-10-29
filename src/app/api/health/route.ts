import { one } from '@/server/db'
import { json, route } from '@/server/http'

export const dynamic = 'force-dynamic'

/** For uptime monitors / platform health checks: touches the database. */
export const GET = route(() => json({ ok: one<{ n: number }>('SELECT 1 AS n')?.n === 1 }))
