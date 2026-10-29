import { liveCatalog } from '@/server/catalog'
import { json, route } from '@/server/http'

export const dynamic = 'force-dynamic'

/** Public: active products with live stock and prices. */
export const GET = route(() => json(liveCatalog()))
