import { createBackup } from '@/server/admin'
import { route } from '@/server/http'

export const dynamic = 'force-dynamic'

/** Admin-only consistent snapshot of the whole database (orders, users, catalogue, settings). */
export const GET = route((req) => createBackup(req))
