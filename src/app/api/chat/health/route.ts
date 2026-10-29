import { chatHealth } from '@/server/chat'
import { json, route } from '@/server/http'

export const dynamic = 'force-dynamic'

export const GET = route(() => json(chatHealth()))
