import { json, route } from '@/server/http'
import { liveCatalog } from '@/server/catalog'

export const dynamic = 'force-dynamic'

export const GET = route(() => json(liveCatalog()))
