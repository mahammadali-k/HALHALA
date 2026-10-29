import { route } from '@/server/http'
import { json } from '@/server/http'
import { publicConfig } from '@/server/catalog'

export const dynamic = 'force-dynamic'

export const GET = route(() => json(publicConfig()))
