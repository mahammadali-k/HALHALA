import { route } from '@/server/http'
import { streamChat } from '@/server/chat'

// Streams Server-Sent Events from Claude. Origin is checked inside; there is no session to protect.
export const POST = route((req) => streamChat(req), { csrf: false })
