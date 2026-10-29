import { setStock } from '@/server/admin'
import { liveCatalog } from '@/server/catalog'
import { json, route } from '@/server/http'

export const PATCH = route(async (req) => { await setStock(req); return json(liveCatalog()) })
