import { timingSafeEqual, randomBytes } from 'node:crypto'
import { catalog, db, tx } from './db.mjs'
import { currentUser, requireAdmin, requireUser } from './auth.mjs'
import { ApiError, clientIp, limiter, readForm, readJson, send, sendText, toCsv } from './http.mjs'
import { notifyOwner } from './notify.mjs'
import { createCardPayment, decodeData, fetchPaymentStatus, isPaymentMethod, paymentMethods, verifySignature } from './payments.mjs'

const byId = new Map(catalog.map((p) => [p.id, p]))
const STATUSES = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled']
const NEXT = { new: ['confirmed', 'cancelled'], confirmed: ['shipped', 'cancelled'], shipped: ['delivered', 'cancelled'], delivered: [], cancelled: [] }
const PAY_STATUSES = ['unpaid', 'pending', 'paid', 'failed', 'refunded']
const orderLimit = limiter(10, 3600_000)
const trackLimit = limiter(10, 10 * 60_000)
const CARD_HOLD_MINUTES = process.env.CARD_HOLD_MINUTES ? Number(process.env.CARD_HOLD_MINUTES) : 30 // unpaid card orders release their stock after this long

const q = (azn) => Math.round(azn * 100)
const azn = (qepik) => qepik / 100
const deliveryFee = (subtotalQ) => {
  const fee = q(Number(process.env.DELIVERY_FEE_AZN) || 0)
  const free = process.env.FREE_DELIVERY_FROM_AZN ? q(Number(process.env.FREE_DELIVERY_FROM_AZN)) : null
  return free !== null && subtotalQ >= free ? 0 : fee
}

/** Admin price overrides win over catalog.json. */
function priceQMap() {
  const m = new Map(catalog.map((p) => [p.id, q(p.price)]))
  for (const r of db.prepare('SELECT product_id, price_q FROM price_overrides').all()) if (m.has(r.product_id)) m.set(r.product_id, r.price_q)
  return m
}
const pricesAzn = () => Object.fromEntries([...priceQMap()].map(([id, v]) => [id, azn(v)]))

export const publicConfig = () => ({
  payments: paymentMethods(),
  currency: 'AZN',
  deliveryFee: Number(process.env.DELIVERY_FEE_AZN) || 0,
  freeDeliveryFrom: process.env.FREE_DELIVERY_FROM_AZN ? Number(process.env.FREE_DELIVERY_FROM_AZN) : null,
})

function stockMap() {
  const out = {}
  for (const r of db.prepare('SELECT product_id, size, qty FROM stock').all()) (out[r.product_id] ??= {})[r.size] = r.qty
  return out
}
const liveCatalog = () => ({ stock: stockMap(), prices: pricesAzn() })

function loadOrder(row) {
  const items = db.prepare('SELECT product_id AS productId, name, size, quantity, unit_price FROM order_items WHERE order_id = ? ORDER BY id').all(row.id)
    .map((i) => ({ productId: i.productId, name: i.name, size: i.size, quantity: i.quantity, unitPrice: azn(i.unit_price) }))
  return {
    number: row.number, status: row.status, paymentMethod: row.payment_method, paymentStatus: row.payment_status,
    subtotal: azn(row.subtotal), deliveryFee: azn(row.delivery_fee), total: azn(row.total),
    name: row.name, phone: row.phone, email: row.email ?? '', city: row.city, address: row.address, notes: row.notes ?? '',
    createdAt: row.created_at, paidAt: row.paid_at ?? null, items,
  }
}
const orderById = (id) => db.prepare('SELECT * FROM orders WHERE id = ?').get(id)

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const digits = (p) => p.replace(/\D/g, '')
const phoneOk = (p) => { const d = digits(p); return /^[+\d][\d\s()+-]*$/.test(p) && d.length >= 7 && d.length <= 15 }

function newNumber() {
  const d = new Date(), pad = (n) => String(n).padStart(2, '0')
  for (let i = 0; i < 20; i++) {
    const n = `HH-${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
    if (!db.prepare('SELECT 1 FROM orders WHERE number = ?').get(n)) return n
  }
  throw new ApiError(500, 'server')
}

function restock(orderId) {
  const upd = db.prepare('UPDATE stock SET qty = qty + ? WHERE product_id = ? AND size = ?')
  for (const i of db.prepare('SELECT product_id, size, quantity FROM order_items WHERE order_id = ?').all(orderId)) upd.run(i.quantity, i.product_id, i.size)
}
/** Cancels an order and returns its stock (idempotent). */
function cancelOrder(row) {
  tx(() => {
    const cur = orderById(row.id)
    if (cur.status === 'cancelled') return
    db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(cur.id)
    restock(cur.id)
  })
}

const same = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))
const canAccess = (req, row, token) => {
  const u = currentUser(req)
  return Boolean((u && (u.role === 'admin' || u.id === row.user_id)) || (token && row.access_token && same(String(token), row.access_token)))
}

// ---------------------------------------------------------------- card payment state
function markPaid(row, ref) {
  if (row.payment_status === 'paid') return
  db.prepare("UPDATE orders SET payment_status = 'paid', paid_at = datetime('now'), payment_ref = COALESCE(?, payment_ref) WHERE id = ?").run(ref ?? null, row.id)
  void notifyOwner(`💳 Payment received for ${row.number} — ${azn(row.total)} AZN`)
}
const markFailed = (row) => { if (row.payment_status === 'pending') db.prepare("UPDATE orders SET payment_status = 'failed' WHERE id = ?").run(row.id) }

/** Asks the gateway for the real status (used when the callback has not arrived, or before releasing stock). */
async function refreshCard(row) {
  if (row.payment_method !== 'card' || row.payment_status !== 'pending' || !row.payment_ref) return orderById(row.id)
  try {
    const s = await fetchPaymentStatus(row.payment_ref)
    if (s.status === 'success' && Math.abs(Number(s.amount) - azn(row.total)) < 0.005) markPaid(row, row.payment_ref)
    else if (s.status === 'failed' || s.status === 'error') markFailed(row)
  } catch (e) { console.error('[payments] status check failed', e instanceof Error ? e.message : e) }
  return orderById(row.id)
}

async function startCardPayment(row, lang) {
  const token = row.access_token
  const { redirectUrl, transaction } = await createCardPayment(row, token, lang)
  db.prepare("UPDATE orders SET payment_ref = ?, payment_status = 'pending' WHERE id = ?").run(transaction, row.id)
  return redirectUrl
}

/** Gateway → us. Authenticity = signature over the raw `data` field. */
async function handleEpointCallback(req, res) {
  const form = await readForm(req)
  if (!verifySignature(form.data, form.signature)) return sendText(res, 400, 'bad signature')
  let d
  try { d = decodeData(form.data) } catch { return sendText(res, 400, 'bad data') }
  const row = db.prepare('SELECT * FROM orders WHERE number = ?').get(String(d.order_id ?? ''))
  if (!row || row.payment_method !== 'card') return sendText(res, 200, 'ok') // unknown order: acknowledge, do nothing
  if (d.status === 'success') {
    if (Math.abs(Number(d.amount) - azn(row.total)) < 0.005) markPaid(row, d.transaction ?? null)
    else console.error('[payments] amount mismatch', row.number, d.amount, azn(row.total))
  } else if (d.status === 'failed' || d.status === 'error') markFailed(row)
  return sendText(res, 200, 'ok')
}

/** Frees stock of card orders that were never paid; pays-out orders the callback missed. */
async function sweepUnpaidCardOrders() {
  const rows = db.prepare(`SELECT * FROM orders WHERE payment_method = 'card' AND status = 'new' AND payment_status IN ('pending','failed')
    AND created_at < datetime('now', ?)`).all(`-${CARD_HOLD_MINUTES} minutes`)
  for (const r of rows) {
    const cur = await refreshCard(r)
    if (cur.payment_status !== 'paid') cancelOrder(cur)
  }
}
setInterval(() => { sweepUnpaidCardOrders().catch((e) => console.error('[sweep]', e)) }, Number(process.env.SWEEP_MS) || 5 * 60_000).unref()

// ---------------------------------------------------------------- create order
async function createOrder(req, res) {
  if (orderLimit(clientIp(req))) throw new ApiError(429, 'rate_limited')
  const b = await readJson(req)
  const user = currentUser(req)

  const rawItems = Array.isArray(b.items) ? b.items : []
  if (!rawItems.length || rawItems.length > 20) throw new ApiError(400, 'invalid_input')
  const merged = new Map()
  for (const it of rawItems) {
    const p = byId.get(it?.productId), size = str(it?.size, 12), quantity = Number(it?.quantity)
    if (!p || !(size in p.stock) || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) throw new ApiError(400, 'invalid_input')
    const k = `${p.id}|${size}`
    merged.set(k, { p, size, quantity: (merged.get(k)?.quantity ?? 0) + quantity })
  }
  const c = b.contact ?? {}
  const contact = { name: str(c.name, 80), phone: str(c.phone, 30), email: str(c.email, 254), city: str(c.city, 80), address: str(c.address, 300), notes: str(c.notes, 500) }
  const fields = {}
  if (contact.name.length < 2) fields.name = 'name'
  if (!phoneOk(contact.phone)) fields.phone = 'phone'
  if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(contact.email)) fields.email = 'email'
  if (contact.city.length < 2) fields.city = 'city'
  if (contact.address.length < 5) fields.address = 'address'
  if (Object.keys(fields).length) throw new ApiError(400, 'invalid_input', { fields })
  const method = str(b.paymentMethod, 20)
  if (!isPaymentMethod(method)) throw new ApiError(400, 'invalid_input')
  const lang = ['az', 'ru', 'en'].includes(b.lang) ? b.lang : 'en'

  const prices = priceQMap()
  const token = randomBytes(18).toString('base64url')
  const row = tx(() => {
    const check = db.prepare('SELECT qty FROM stock WHERE product_id = ? AND size = ?')
    const dec = db.prepare('UPDATE stock SET qty = qty - ? WHERE product_id = ? AND size = ? AND qty >= ?')
    const short = []
    for (const { p, size, quantity } of merged.values()) {
      const have = check.get(p.id, size)?.qty ?? 0
      if (have < quantity) short.push({ productId: p.id, size, available: have })
    }
    if (short.length) throw new ApiError(409, 'out_of_stock', { items: short })
    for (const { p, size, quantity } of merged.values()) dec.run(quantity, p.id, size, quantity)

    const subtotal = [...merged.values()].reduce((n, { p, quantity }) => n + prices.get(p.id) * quantity, 0)
    const fee = deliveryFee(subtotal)
    const { lastInsertRowid } = db.prepare(`INSERT INTO orders (number, user_id, payment_method, payment_status, subtotal, delivery_fee, total, name, phone, email, city, address, notes, lang, access_token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(newNumber(), user?.id ?? null, method, method === 'card' ? 'pending' : 'unpaid', subtotal, fee, subtotal + fee,
      contact.name, contact.phone, contact.email || null, contact.city, contact.address, contact.notes || null, lang, token)
    const ins = db.prepare('INSERT INTO order_items (order_id, product_id, name, size, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?)')
    for (const { p, size, quantity } of merged.values()) ins.run(lastInsertRowid, p.id, p.name, size, quantity, prices.get(p.id))
    return orderById(lastInsertRowid)
  })

  let paymentUrl = null
  if (method === 'card') {
    try { paymentUrl = await startCardPayment(row, lang) } catch (e) {
      console.error('[payments] could not start payment', e instanceof Error ? e.message : e)
      cancelOrder(row) // nothing was charged: release the reserved stock
      throw new ApiError(502, 'payment_unavailable')
    }
  }

  const order = loadOrder(orderById(row.id))
  void notifyOwner(
    `🛍 New order ${order.number}\n${order.items.map((i) => `• ${i.name} — ${i.size} × ${i.quantity}`).join('\n')}\nTotal: ${order.total} AZN (${order.paymentMethod}${method === 'card' ? ', awaiting payment' : ''})\n` +
    `${order.name} · ${order.phone}${order.email ? ` · ${order.email}` : ''}\n${order.city}, ${order.address}${order.notes ? `\nNote: ${order.notes}` : ''}`)
  send(res, 201, { order, token, paymentUrl, ...liveCatalog() })
}

// ---------------------------------------------------------------- admin helpers
const like = (s) => `%${s.replace(/[\\%_]/g, (m) => `\\${m}`)}%`

function adminOrders(req) {
  const u = new URL(req.url, 'http://x').searchParams
  const status = u.get('status'), search = (u.get('q') ?? '').trim().slice(0, 60)
  const where = [], params = []
  if (STATUSES.includes(status)) { where.push('status = ?'); params.push(status) }
  if (search) { where.push("(number LIKE ? ESCAPE '\\' OR name LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\' OR email LIKE ? ESCAPE '\\')"); params.push(...Array(4).fill(like(search))) }
  return db.prepare(`SELECT * FROM orders ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY id DESC LIMIT 300`).all(...params)
}

function adminUsers(req) {
  const search = (new URL(req.url, 'http://x').searchParams.get('q') ?? '').trim().slice(0, 60)
  return db.prepare(`SELECT u.id, u.email, u.name, u.phone, u.city, u.address, u.role, u.created_at AS createdAt,
      (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders,
      (SELECT COALESCE(SUM(total), 0) FROM orders o WHERE o.user_id = u.id AND o.status != 'cancelled') AS spent
    FROM users u ${search ? "WHERE u.email LIKE ? ESCAPE '\\' OR u.name LIKE ? ESCAPE '\\' OR u.phone LIKE ? ESCAPE '\\'" : ''} ORDER BY u.id DESC LIMIT 500`)
    .all(...(search ? Array(3).fill(like(search)) : [])).map((r) => ({ ...r, spent: azn(r.spent) }))
}

function adminStats() {
  const one = (sql, ...p) => db.prepare(sql).get(...p)
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0]))
  for (const r of db.prepare('SELECT status, COUNT(*) c FROM orders GROUP BY status').all()) byStatus[r.status] = r.c
  return {
    ordersToday: one("SELECT COUNT(*) c FROM orders WHERE date(created_at) = date('now')").c,
    ordersTotal: one('SELECT COUNT(*) c FROM orders').c,
    byStatus,
    revenuePaid: azn(one("SELECT COALESCE(SUM(total),0) s FROM orders WHERE payment_status = 'paid' AND status != 'cancelled'").s),
    revenueExpected: azn(one("SELECT COALESCE(SUM(total),0) s FROM orders WHERE payment_status != 'paid' AND status NOT IN ('cancelled','delivered')").s),
    users: one('SELECT COUNT(*) c FROM users').c,
    lowStock: db.prepare('SELECT product_id AS productId, size, qty FROM stock WHERE qty <= 2 ORDER BY qty, product_id').all().map((r) => ({ ...r, name: byId.get(r.productId)?.name ?? r.productId })),
  }
}

// ---------------------------------------------------------------- router
export async function handleOrders(req, res, path) {
  if (path === '/api/config' && req.method === 'GET') return send(res, 200, publicConfig())
  if (path === '/api/stock' && req.method === 'GET') return send(res, 200, liveCatalog())
  if (path === '/api/payments/epoint/callback' && req.method === 'POST') return handleEpointCallback(req, res)

  if (path === '/api/orders' && req.method === 'POST') return createOrder(req, res)

  if (path === '/api/orders/mine' && req.method === 'GET') {
    const u = requireUser(req)
    return send(res, 200, { orders: db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 100').all(u.id).map(loadOrder) })
  }

  // Guest-safe tracking by order number + the phone used on the order (used by the chat assistant)
  if (path === '/api/orders/track' && req.method === 'POST') {
    if (trackLimit(clientIp(req))) throw new ApiError(429, 'rate_limited')
    const b = await readJson(req)
    const row = db.prepare('SELECT * FROM orders WHERE number = ?').get(str(b.number, 40).toUpperCase())
    const tail = (p) => digits(p).slice(-7)
    if (!row || tail(str(b.phone, 30)).length < 7 || tail(row.phone) !== tail(str(b.phone, 30))) throw new ApiError(404, 'not_found')
    const o = loadOrder(await refreshCard(row))
    return send(res, 200, { order: { number: o.number, status: o.status, paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus, total: o.total, createdAt: o.createdAt } })
  }

  const lookup = path.match(/^\/api\/orders\/lookup\/([\w-]+)$/)
  if (lookup && req.method === 'GET') {
    const row = db.prepare('SELECT * FROM orders WHERE number = ?').get(lookup[1])
    const token = new URL(req.url, 'http://x').searchParams.get('t')
    if (!row || !canAccess(req, row, token)) throw new ApiError(404, 'not_found')
    return send(res, 200, { order: loadOrder(await refreshCard(row)) })
  }

  const pay = path.match(/^\/api\/orders\/([\w-]+)\/pay$/)
  if (pay && req.method === 'POST') {
    const b = await readJson(req)
    const row = db.prepare('SELECT * FROM orders WHERE number = ?').get(pay[1])
    if (!row || !canAccess(req, row, b.token)) throw new ApiError(404, 'not_found')
    const cur = await refreshCard(row)
    if (cur.payment_method !== 'card' || cur.status !== 'new' || !['pending', 'failed'].includes(cur.payment_status)) throw new ApiError(409, 'closed_status')
    try { return send(res, 200, { paymentUrl: await startCardPayment(cur, cur.lang) }) } catch (e) {
      console.error('[payments] could not start payment', e instanceof Error ? e.message : e)
      throw new ApiError(502, 'payment_unavailable')
    }
  }

  const cancel = path.match(/^\/api\/orders\/([\w-]+)\/cancel$/)
  if (cancel && req.method === 'POST') {
    const u = requireUser(req)
    const row = db.prepare('SELECT * FROM orders WHERE number = ? AND user_id = ?').get(cancel[1], u.id)
    if (!row) throw new ApiError(404, 'not_found')
    const cur = await refreshCard(row)
    if (cur.status !== 'new' || cur.payment_status === 'paid') throw new ApiError(409, 'closed_status') // paid orders are cancelled by the shop (refund needed)
    cancelOrder(cur)
    return send(res, 200, { order: loadOrder(orderById(row.id)), ...liveCatalog() })
  }

  // ---- admin ----
  if (path === '/api/admin/stats' && req.method === 'GET') { requireAdmin(req); return send(res, 200, adminStats()) }
  if (path === '/api/admin/orders' && req.method === 'GET') { requireAdmin(req); return send(res, 200, { orders: adminOrders(req).map(loadOrder) }) }
  if (path === '/api/admin/users' && req.method === 'GET') { requireAdmin(req); return send(res, 200, { users: adminUsers(req) }) }

  if (path === '/api/admin/export/orders.csv' && req.method === 'GET') {
    requireAdmin(req)
    const rows = db.prepare('SELECT * FROM orders ORDER BY id DESC').all().map(loadOrder).map((o) => [
      o.number, o.createdAt, o.status, o.paymentMethod, o.paymentStatus, o.paidAt ?? '', o.subtotal, o.deliveryFee, o.total, o.name, o.phone, o.email, o.city, o.address, o.notes,
      o.items.map((i) => `${i.name} ${i.size} x${i.quantity}`).join('; '),
    ])
    return sendText(res, 200, toCsv(['number', 'created_at', 'status', 'payment_method', 'payment_status', 'paid_at', 'subtotal_azn', 'delivery_azn', 'total_azn', 'name', 'phone', 'email', 'city', 'address', 'notes', 'items'], rows),
      { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="halhala-orders.csv"' })
  }
  if (path === '/api/admin/export/users.csv' && req.method === 'GET') {
    requireAdmin(req)
    const rows = adminUsers({ url: '/' }).map((u) => [u.id, u.email, u.name, u.phone, u.city, u.address, u.role, u.createdAt, u.orders, u.spent])
    return sendText(res, 200, toCsv(['id', 'email', 'name', 'phone', 'city', 'address', 'role', 'created_at', 'orders', 'spent_azn'], rows),
      { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="halhala-users.csv"' })
  }

  const adm = path.match(/^\/api\/admin\/orders\/([\w-]+)$/)
  if (adm && req.method === 'PATCH') {
    requireAdmin(req)
    const b = await readJson(req)
    const row = db.prepare('SELECT * FROM orders WHERE number = ?').get(adm[1])
    if (!row) throw new ApiError(404, 'not_found')
    tx(() => {
      if (b.status !== undefined) {
        if (!STATUSES.includes(b.status) || !NEXT[row.status].includes(b.status)) throw new ApiError(409, 'closed_status')
        db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(b.status, row.id)
        if (b.status === 'cancelled') restock(row.id)
      }
      if (b.paymentStatus !== undefined) {
        if (!PAY_STATUSES.includes(b.paymentStatus)) throw new ApiError(400, 'invalid_input')
        db.prepare("UPDATE orders SET payment_status = ?, paid_at = CASE WHEN ? = 'paid' THEN COALESCE(paid_at, datetime('now')) ELSE paid_at END WHERE id = ?").run(b.paymentStatus, b.paymentStatus, row.id)
      }
    })
    return send(res, 200, { order: loadOrder(orderById(row.id)), ...liveCatalog() })
  }

  const role = path.match(/^\/api\/admin\/users\/(\d+)$/)
  if (role && req.method === 'PATCH') {
    const me = requireAdmin(req)
    const b = await readJson(req)
    if (Number(role[1]) === me.id || !['customer', 'admin'].includes(b.role)) throw new ApiError(400, 'invalid_input')
    if (!db.prepare('UPDATE users SET role = ? WHERE id = ?').run(b.role, Number(role[1])).changes) throw new ApiError(404, 'not_found')
    return send(res, 200, { users: adminUsers({ url: '/' }) })
  }

  if (path === '/api/admin/stock' && req.method === 'PATCH') {
    requireAdmin(req)
    const b = await readJson(req)
    const qty = Number(b.qty), p = byId.get(b.productId)
    if (!p || !(b.size in p.stock) || !Number.isInteger(qty) || qty < 0 || qty > 100000) throw new ApiError(400, 'invalid_input')
    db.prepare('UPDATE stock SET qty = ? WHERE product_id = ? AND size = ?').run(qty, p.id, b.size)
    return send(res, 200, liveCatalog())
  }

  if (path === '/api/admin/price' && req.method === 'PATCH') {
    requireAdmin(req)
    const b = await readJson(req)
    const price = Number(b.price), p = byId.get(b.productId)
    if (!p || !Number.isFinite(price) || price <= 0 || price > 100000) throw new ApiError(400, 'invalid_input')
    db.prepare('INSERT INTO price_overrides (product_id, price_q) VALUES (?, ?) ON CONFLICT(product_id) DO UPDATE SET price_q = excluded.price_q').run(p.id, q(price))
    return send(res, 200, liveCatalog())
  }

  throw new ApiError(404, 'not_found')
}
