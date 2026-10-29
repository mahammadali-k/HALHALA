import { resetUserPassword } from '@/server/admin'
import { json, route } from '@/server/http'

/** Admin sets a one-time temporary password for a customer who is locked out (no e-mail service needed). */
export const POST = route<{ id: string }>(async (req, { id }) => json({ temporaryPassword: await resetUserPassword(req, Number(id)) }))
