import 'server-only'
import type { NextRequest } from 'next/server'
import { clean } from '@/lib/validate'
import { NEXT_STATUS, ORDER_STATUSES, PAYMENT_STATUSES, type Order, type OrderStatus, type Stats, type UserRow } from '@/types/api'
import { randomBytes } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { hashPassword, requireAdmin } from './auth'
import { listProducts, toAzn } from './catalog'
import { db, many, one, run, tx, type OrderDbRow } from './db'
import { ApiError, readJson } from './http'
import { loadOrder, orderById, orderByNumber, setOrderStatus } from './orders'

const like = (s: string) => `%${s.replace(/[\\%_]/g, (m) => `\\${m}`)}%`

export function listOrders(req: NextRequest): Order[] {
  requireAdmin(req)
  const q = new URL(req.url).searchParams
  const status = q.get('status'), search = clean(q.get('q'), 60)
  const where: string[] = [], params: string[] = []
  if (status && (ORDER_STATUSES as string[]).includes(status)) { where.push('status = ?'); params.push(status) }
  if (search) { where.push("(number LIKE ? ESCAPE '\\' OR name LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\')"); params.push(...Array(4).fill(like(search))) }
  return many<OrderDbRow>(`SELECT * FROM orders ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY id DESC LIMIT 300`, ...params).map(loadOrder)
}
/** Every order (for CSV export). */
export const allOrders = (req: NextRequest) => { requireAdmin(req); return many<OrderDbRow>('SELECT * FROM orders ORDER BY id DESC').map(loadOrder) }

export function listUsers(req: NextRequest, search = ''): UserRow[] {
  requireAdmin(req)
  const q = clean(search, 60)
  return many<UserRow & { created_at: string }>(`SELECT u.id, u.email, u.name, COALESCE(u.phone,'') AS phone, COALESCE(u.city,'') AS city, COALESCE(u.address,'') AS address, u.role, u.created_at AS createdAt,
      (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders,
      (SELECT COALESCE(SUM(total), 0) FROM orders o WHERE o.user_id = u.id AND o.status != 'cancelled') AS spent
    FROM users u ${q ? "WHERE u.email LIKE ? ESCAPE '\\' OR u.name LIKE ? ESCAPE '\\' OR u.phone LIKE ? ESCAPE '\\'" : ''} ORDER BY u.id DESC LIMIT 500`,
    ...(q ? Array(3).fill(like(q)) : [])).map((r) => ({ ...r, spent: toAzn(r.spent) }))
}

export async function setRole(req: NextRequest, id: number) {
  const me = requireAdmin(req)
  const b = await readJson(req)
  if (id === me.id || (b.role !== 'customer' && b.role !== 'admin')) throw new ApiError(400, 'invalid_input')
  if (!run('UPDATE users SET role = ? WHERE id = ?', b.role, id).changes) throw new ApiError(404, 'not_found')
  return listUsers(req)
}

export function stats(req: NextRequest): Stats {
  requireAdmin(req)
  const n = (sql: string) => one<{ n: number }>(sql)!.n
  const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<OrderStatus, number>
  for (const r of many<{ status: OrderStatus; c: number }>('SELECT status, COUNT(*) c FROM orders GROUP BY status')) byStatus[r.status] = r.c
  return {
    ordersToday: n("SELECT COUNT(*) n FROM orders WHERE date(created_at) = date('now')"),
    ordersTotal: n('SELECT COUNT(*) n FROM orders'),
    byStatus,
    revenuePaid: toAzn(n("SELECT COALESCE(SUM(total),0) n FROM orders WHERE payment_status = 'paid' AND status != 'cancelled'")),
    revenueExpected: toAzn(n("SELECT COALESCE(SUM(total),0) n FROM orders WHERE payment_status != 'paid' AND status NOT IN ('cancelled','delivered')")),
    users: n('SELECT COUNT(*) n FROM users'),
    lowStock: lowStock(),
  }
}

/** Sizes of active products with ≤ 2 units left. */
function lowStock(): Stats['lowStock'] {
  return listProducts().flatMap((p) => Object.entries(p.stock).filter(([, q]) => (q ?? 0) <= 2).map(([size, qty]) => ({ productId: p.id, name: p.name, size, qty: qty ?? 0 })))
    .sort((a, b) => a.qty - b.qty || a.name.localeCompare(b.name))
}

export async function patchOrder(req: NextRequest, number: string) {
  requireAdmin(req)
  const b = await readJson(req)
  const row = orderByNumber(number)
  if (!row) throw new ApiError(404, 'not_found')
  tx(() => {
    if (b.status !== undefined) {
      const to = b.status as OrderStatus
      if (!ORDER_STATUSES.includes(to) || !NEXT_STATUS[row.status as OrderStatus].includes(to)) throw new ApiError(409, 'closed_status')
      setOrderStatus(row, to)
    }
    if (b.paymentStatus !== undefined) {
      if (!(PAYMENT_STATUSES as unknown[]).includes(b.paymentStatus)) throw new ApiError(400, 'invalid_input')
      run("UPDATE orders SET payment_status = ?, paid_at = CASE WHEN ? = 'paid' THEN COALESCE(paid_at, datetime('now')) ELSE paid_at END WHERE id = ?", b.paymentStatus as string, b.paymentStatus as string, row.id)
    }
  })
  return loadOrder(orderById(row.id))
}

/** Sets a random one-time password for a user and signs them out everywhere. Returns it once for the admin to pass on. */
export async function resetUserPassword(req: NextRequest, id: number) {
  requireAdmin(req)
  if (!one('SELECT 1 FROM users WHERE id = ?', id)) throw new ApiError(404, 'not_found')
  const temp = randomBytes(9).toString('base64url')
  run('UPDATE users SET password_hash = ? WHERE id = ?', await hashPassword(temp), id)
  run('DELETE FROM sessions WHERE user_id = ?', id)
  return temp
}

/** Consistent snapshot of the SQLite database (VACUUM INTO) as a download. */
export async function createBackup(req: NextRequest) {
  requireAdmin(req)
  const dir = await mkdtemp(path.join(tmpdir(), 'halhala-backup-'))
  const file = path.join(dir, 'halhala.db')
  try {
    db().exec(`VACUUM INTO '${file.replace(/'/g, "''")}'`)
    const body = await readFile(file)
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    return new Response(body, { headers: { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="halhala-${stamp}.db"`, 'Cache-Control': 'no-store' } })
  } finally { await rm(dir, { recursive: true, force: true }) }
}
