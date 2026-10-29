import 'server-only'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { clean, isEmail, isPhone, phoneTail } from '@/lib/validate'
import type { Size } from '@/types'
import type { CheckoutContact, CreatedOrder, Order, OrderStatus } from '@/types/api'
import { getSessionUser, requireUser, userFromRequest } from './auth'
import { baseById, deliveryFeeQ, liveCatalog, priceQMap, toAzn } from './catalog'
import { many, one, run, tx, type OrderDbRow } from './db'
import { ApiError, assertNotLimited, clientIp, limiter, readJson } from './http'
import { notifyOwner } from './notify'
import { createCardPayment, decodeData, fetchPaymentStatus, isPaymentMethod, verifySignature } from './payments'

const orderLimit = limiter(10, 3600_000)
const trackLimit = limiter(10, 10 * 60_000)
/** Unpaid card orders release their stock after this long. */
const CARD_HOLD_MINUTES = process.env.CARD_HOLD_MINUTES ? Number(process.env.CARD_HOLD_MINUTES) : 30

// ---------------------------------------------------------------- mapping
export function loadOrder(row: OrderDbRow): Order {
  const items = many<{ product_id: string; name: string; size: string; quantity: number; unit_price: number }>(
    'SELECT product_id, name, size, quantity, unit_price FROM order_items WHERE order_id = ? ORDER BY id', row.id)
    .map((i) => ({ productId: i.product_id, name: i.name, size: i.size, quantity: i.quantity, unitPrice: toAzn(i.unit_price) }))
  return {
    number: row.number, status: row.status as Order['status'], paymentMethod: row.payment_method, paymentStatus: row.payment_status as Order['paymentStatus'],
    subtotal: toAzn(row.subtotal), deliveryFee: toAzn(row.delivery_fee), total: toAzn(row.total),
    name: row.name, phone: row.phone, email: row.email ?? '', city: row.city, address: row.address, notes: row.notes ?? '',
    createdAt: row.created_at, paidAt: row.paid_at, items,
  }
}
export const orderById = (id: number) => one<OrderDbRow>('SELECT * FROM orders WHERE id = ?', id)!
export const orderByNumber = (number: string) => one<OrderDbRow>('SELECT * FROM orders WHERE number = ?', number)

const sameToken = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))
/** Admin, the owner, or anyone holding the order's secret link token. */
export function canAccess(req: NextRequest, row: OrderDbRow, token?: string | null) {
  const u = userFromRequest(req)
  return Boolean((u && (u.role === 'admin' || u.id === row.user_id)) || (token && row.access_token && sameToken(String(token), row.access_token)))
}

// ---------------------------------------------------------------- stock
function restock(orderId: number) {
  for (const i of many<{ product_id: string; size: string; quantity: number }>('SELECT product_id, size, quantity FROM order_items WHERE order_id = ?', orderId))
    run('UPDATE stock SET qty = qty + ? WHERE product_id = ? AND size = ?', i.quantity, i.product_id, i.size)
}
/** Cancels an order and returns its stock (idempotent). */
export function cancelOrder(row: OrderDbRow) {
  tx(() => {
    if (orderById(row.id).status === 'cancelled') return
    run("UPDATE orders SET status = 'cancelled' WHERE id = ?", row.id)
    restock(row.id)
  })
}
export const setOrderStatus = (row: OrderDbRow, status: OrderStatus) => {
  run('UPDATE orders SET status = ? WHERE id = ?', status, row.id)
  if (status === 'cancelled') restock(row.id)
}

// ---------------------------------------------------------------- card payment state
function markPaid(row: OrderDbRow, ref: string | null) {
  if (row.payment_status === 'paid') return
  run("UPDATE orders SET payment_status = 'paid', paid_at = datetime('now'), payment_ref = COALESCE(?, payment_ref) WHERE id = ?", ref, row.id)
  void notifyOwner(`💳 Payment received for ${row.number} — ${toAzn(row.total)} AZN`)
}
const markFailed = (row: OrderDbRow) => { if (row.payment_status === 'pending') run("UPDATE orders SET payment_status = 'failed' WHERE id = ?", row.id) }

/** Asks the gateway for the real status (callback missed, or before releasing stock). Returns the fresh row. */
export async function refreshCard(row: OrderDbRow): Promise<OrderDbRow> {
  if (row.payment_method !== 'card' || row.payment_status !== 'pending' || !row.payment_ref) return orderById(row.id)
  try {
    const s = await fetchPaymentStatus(row.payment_ref)
    if (s.status === 'success' && Math.abs(Number(s.amount) - toAzn(row.total)) < 0.005) markPaid(row, row.payment_ref)
    else if (s.status === 'failed' || s.status === 'error') markFailed(row)
  } catch (e) { console.error('[payments] status check failed', e instanceof Error ? e.message : e) }
  return orderById(row.id)
}

async function startCardPayment(row: OrderDbRow) {
  const { redirectUrl, transaction } = await createCardPayment(row, row.access_token ?? '', row.lang ?? 'en')
  run("UPDATE orders SET payment_ref = ?, payment_status = 'pending' WHERE id = ?", transaction, row.id)
  return redirectUrl
}

/** Gateway → us. Authenticity = the signature over the raw `data` field; the amount must match the order. */
export function applyEpointCallback(form: Record<string, string>) {
  if (!verifySignature(form.data, form.signature)) throw new ApiError(400, 'bad_signature')
  let d: Record<string, unknown>
  try { d = decodeData(form.data) } catch { throw new ApiError(400, 'bad_data') }
  const row = orderByNumber(String(d.order_id ?? ''))
  if (!row || row.payment_method !== 'card') return // unknown order: acknowledge, do nothing
  if (d.status === 'success') {
    if (Math.abs(Number(d.amount) - toAzn(row.total)) < 0.005) markPaid(row, typeof d.transaction === 'string' ? d.transaction : null)
    else console.error('[payments] amount mismatch', row.number, d.amount, toAzn(row.total))
  } else if (d.status === 'failed' || d.status === 'error') markFailed(row)
}

/** Frees stock of card orders that were never paid (after checking the gateway one last time). */
export async function sweepUnpaidCardOrders() {
  const rows = many<OrderDbRow>(`SELECT * FROM orders WHERE payment_method = 'card' AND status = 'new' AND payment_status IN ('pending','failed')
    AND created_at < datetime('now', ?)`, `-${CARD_HOLD_MINUTES} minutes`)
  for (const r of rows) {
    const cur = await refreshCard(r)
    if (cur.payment_status !== 'paid') cancelOrder(cur)
  }
}
const g = globalThis as unknown as { __hhSweeper?: ReturnType<typeof setInterval> }
/** Starts the background sweep once per server process (called from instrumentation.ts). */
export function startSweeper() {
  if (g.__hhSweeper) return
  g.__hhSweeper = setInterval(() => { sweepUnpaidCardOrders().catch((e) => console.error('[sweep]', e)) }, Number(process.env.SWEEP_MS) || 5 * 60_000)
  g.__hhSweeper.unref()
}

// ---------------------------------------------------------------- use-cases
function newNumber() {
  const d = new Date(), pad = (n: number) => String(n).padStart(2, '0')
  for (let i = 0; i < 20; i++) {
    const n = `HH-${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    if (!orderByNumber(n)) return n
  }
  throw new ApiError(500, 'server')
}

interface OrderInput { items?: { productId?: unknown; size?: unknown; quantity?: unknown }[]; contact?: Record<string, unknown>; paymentMethod?: unknown; lang?: unknown }

export async function createOrder(req: NextRequest): Promise<CreatedOrder> {
  assertNotLimited(orderLimit(clientIp(req)))
  const b = await readJson<OrderInput>(req)
  const user = userFromRequest(req)

  // ---- validate (prices and totals from the client are never trusted) ----
  const raw = Array.isArray(b.items) ? b.items : []
  if (!raw.length || raw.length > 20) throw new ApiError(400, 'invalid_input')
  const lines = new Map<string, { id: string; size: Size; quantity: number }>()
  for (const it of raw) {
    const p = baseById.get(String(it?.productId)), size = clean(it?.size, 12), quantity = Number(it?.quantity)
    if (!p || !(size in p.stock) || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) throw new ApiError(400, 'invalid_input')
    const k = `${p.id}|${size}`
    lines.set(k, { id: p.id, size: size as Size, quantity: (lines.get(k)?.quantity ?? 0) + quantity })
  }
  const c = b.contact ?? {}
  const contact: CheckoutContact = { name: clean(c.name, 80), phone: clean(c.phone, 30), email: clean(c.email, 254), city: clean(c.city, 80), address: clean(c.address, 300), notes: clean(c.notes, 500) }
  const fields: Record<string, string> = {}
  if (contact.name.length < 2) fields.name = 'name'
  if (!isPhone(contact.phone)) fields.phone = 'phone'
  if (contact.email && !isEmail(contact.email)) fields.email = 'email'
  if (contact.city.length < 2) fields.city = 'city'
  if (contact.address.length < 5) fields.address = 'address'
  if (Object.keys(fields).length) throw new ApiError(400, 'invalid_input', { fields })
  const method = clean(b.paymentMethod, 20)
  if (!isPaymentMethod(method)) throw new ApiError(400, 'invalid_input')
  const lang = ['az', 'ru', 'en'].includes(String(b.lang)) ? String(b.lang) : 'en'

  // ---- reserve stock + store the order atomically ----
  const prices = priceQMap()
  const token = randomBytes(18).toString('base64url')
  const row = tx(() => {
    const short = [...lines.values()].flatMap((l) => {
      const have = one<{ qty: number }>('SELECT qty FROM stock WHERE product_id = ? AND size = ?', l.id, l.size)?.qty ?? 0
      return have < l.quantity ? [{ productId: l.id, size: l.size, available: have }] : []
    })
    if (short.length) throw new ApiError(409, 'out_of_stock', { items: short })
    for (const l of lines.values()) run('UPDATE stock SET qty = qty - ? WHERE product_id = ? AND size = ?', l.quantity, l.id, l.size)

    const subtotal = [...lines.values()].reduce((n, l) => n + prices.get(l.id)! * l.quantity, 0)
    const fee = deliveryFeeQ(subtotal)
    const { lastInsertRowid } = run(`INSERT INTO orders (number, user_id, payment_method, payment_status, subtotal, delivery_fee, total, name, phone, email, city, address, notes, lang, access_token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, newNumber(), user?.id ?? null, method, method === 'card' ? 'pending' : 'unpaid', subtotal, fee, subtotal + fee,
      contact.name, contact.phone, contact.email || null, contact.city, contact.address, contact.notes || null, lang, token)
    for (const l of lines.values()) run('INSERT INTO order_items (order_id, product_id, name, size, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?)', lastInsertRowid, l.id, baseById.get(l.id)!.name, l.size, l.quantity, prices.get(l.id)!)
    return orderById(Number(lastInsertRowid))
  })

  let paymentUrl: string | null = null
  if (method === 'card') {
    try { paymentUrl = await startCardPayment(row) } catch (e) {
      console.error('[payments] could not start payment', e instanceof Error ? e.message : e)
      cancelOrder(row) // nothing was charged: release the reserved stock
      throw new ApiError(502, 'payment_unavailable')
    }
  }
  const order = loadOrder(orderById(row.id))
  void notifyOwner(
    `🛍 New order ${order.number}\n${order.items.map((i) => `• ${i.name} — ${i.size} × ${i.quantity}`).join('\n')}\nTotal: ${order.total} AZN (${order.paymentMethod}${method === 'card' ? ', awaiting payment' : ''})\n` +
    `${order.name} · ${order.phone}${order.email ? ` · ${order.email}` : ''}\n${order.city}, ${order.address}${order.notes ? `\nNote: ${order.notes}` : ''}`)
  return { order, token, paymentUrl, ...liveCatalog() }
}

export const ordersOfUser = (userId: number) => many<OrderDbRow>('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 100', userId).map(loadOrder)
export const myOrders = (req: NextRequest) => ordersOfUser(requireUser(req).id)

/** Order by its secret link (?t=…) or owner/admin session. Card orders are re-checked with the gateway first. */
export async function lookupOrder(req: NextRequest, number: string, token: string | null) {
  const row = orderByNumber(number)
  if (!row || !canAccess(req, row, token)) throw new ApiError(404, 'not_found')
  return loadOrder(await refreshCard(row))
}

/** Guest-safe tracking by order number + the phone used on the order (used by the chat assistant). */
export async function trackOrder(req: NextRequest) {
  assertNotLimited(trackLimit(clientIp(req)))
  const b = await readJson(req)
  const row = orderByNumber(clean(b.number, 40).toUpperCase())
  const phone = phoneTail(clean(b.phone, 30))
  if (!row || phone.length < 7 || phoneTail(row.phone) !== phone) throw new ApiError(404, 'not_found')
  const o = loadOrder(await refreshCard(row))
  return { number: o.number, status: o.status, paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus, total: o.total, createdAt: o.createdAt }
}

export async function payAgain(req: NextRequest, number: string) {
  const b = await readJson(req)
  const row = orderByNumber(number)
  if (!row || !canAccess(req, row, typeof b.token === 'string' ? b.token : null)) throw new ApiError(404, 'not_found')
  const cur = await refreshCard(row)
  if (cur.payment_method !== 'card' || cur.status !== 'new' || !['pending', 'failed'].includes(cur.payment_status)) throw new ApiError(409, 'closed_status')
  try { return await startCardPayment(cur) } catch (e) {
    console.error('[payments] could not start payment', e instanceof Error ? e.message : e)
    throw new ApiError(502, 'payment_unavailable')
  }
}

export async function cancelOwnOrder(req: NextRequest, number: string) {
  const u = requireUser(req)
  const row = one<OrderDbRow>('SELECT * FROM orders WHERE number = ? AND user_id = ?', number, u.id)
  if (!row) throw new ApiError(404, 'not_found')
  const cur = await refreshCard(row)
  if (cur.status !== 'new' || cur.payment_status === 'paid') throw new ApiError(409, 'closed_status') // paid orders are cancelled by the shop (refund needed)
  cancelOrder(cur)
  return loadOrder(orderById(row.id))
}

/** For the order page (Server Component): the order if the visitor holds its secret link or owns it / is admin. */
export async function orderForPage(number: string, token?: string): Promise<Order | null> {
  const row = orderByNumber(number)
  if (!row) return null
  const user = await getSessionUser()
  const ok = (user && (user.role === 'admin' || user.id === row.user_id)) || (token && row.access_token && sameToken(token, row.access_token))
  return ok ? loadOrder(await refreshCard(row)) : null
}
