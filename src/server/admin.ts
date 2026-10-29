import 'server-only'
import type { NextRequest } from 'next/server'
import { clean } from '@/lib/validate'
import type { Size } from '@/types'
import { NEXT_STATUS, ORDER_STATUSES, PAYMENT_STATUSES, type Order, type OrderStatus, type Stats, type UserRow } from '@/types/api'
import { requireAdmin } from './auth'
import { baseById, toAzn, toQepik } from './catalog'
import { many, one, run, tx, type OrderDbRow } from './db'
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
    lowStock: many<{ productId: string; size: string; qty: number }>('SELECT product_id AS productId, size, qty FROM stock WHERE qty <= 2 ORDER BY qty, product_id')
      .map((r) => ({ ...r, name: baseById.get(r.productId)?.name ?? r.productId })),
  }
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

export async function setStock(req: NextRequest) {
  requireAdmin(req)
  const b = await readJson(req)
  const qty = Number(b.qty), p = baseById.get(String(b.productId))
  if (!p || !(String(b.size) in p.stock) || !Number.isInteger(qty) || qty < 0 || qty > 100000) throw new ApiError(400, 'invalid_input')
  run('UPDATE stock SET qty = ? WHERE product_id = ? AND size = ?', qty, p.id, b.size as Size)
}

export async function setPrice(req: NextRequest) {
  requireAdmin(req)
  const b = await readJson(req)
  const price = Number(b.price), p = baseById.get(String(b.productId))
  if (!p || !Number.isFinite(price) || price <= 0 || price > 100000) throw new ApiError(400, 'invalid_input')
  run('INSERT INTO price_overrides (product_id, price_q) VALUES (?, ?) ON CONFLICT(product_id) DO UPDATE SET price_q = excluded.price_q', p.id, toQepik(price))
}
