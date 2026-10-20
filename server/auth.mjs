import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { db } from './db.mjs'
import { ApiError, clientIp, cookie, limiter, parseCookies, readJson, send } from './http.mjs'

const scryptAsync = promisify(scrypt)
const COOKIE = 'hh_session'
const SESSION_DAYS = 30
const adminEmails = () => (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)

async function hashPassword(pw) {
  const salt = randomBytes(16)
  const key = await scryptAsync(pw, salt, 64)
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`
}
async function verifyPassword(pw, stored) {
  const [alg, salt, hash] = stored.split('$')
  if (alg !== 'scrypt') return false
  const key = await scryptAsync(pw, Buffer.from(salt, 'base64'), 64)
  const want = Buffer.from(hash, 'base64')
  return key.length === want.length && timingSafeEqual(key, want)
}
const sha = (s) => createHash('sha256').update(s).digest('hex')

const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, phone: u.phone ?? '', city: u.city ?? '', address: u.address ?? '', role: u.role })

function startSession(req, res, userId) {
  const token = randomBytes(32).toString('base64url')
  db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').run(sha(token), userId, Date.now() + SESSION_DAYS * 864e5)
  res.setHeader('Set-Cookie', cookie(req, COOKIE, token, SESSION_DAYS * 86400))
}

/** Returns the logged-in user row (or null). */
export function currentUser(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE]
  if (!token) return null
  const row = db.prepare('SELECT u.*, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?').get(sha(token))
  if (!row) return null
  if (row.expires_at < Date.now()) { db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(token)); return null }
  return row
}
export const requireUser = (req) => { const u = currentUser(req); if (!u) throw new ApiError(401, 'unauthorized'); return u }
export const requireAdmin = (req) => { const u = requireUser(req); if (u.role !== 'admin') throw new ApiError(403, 'forbidden'); return u }

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254
const validPhone = (p) => { const d = p.replace(/\D/g, ''); return /^[+\d][\d\s()+-]*$/.test(p) && d.length >= 7 && d.length <= 15 }

const registerLimit = limiter(10, 3600_000)
const loginLimit = limiter(10, 15 * 60_000)

export async function handleAuth(req, res, path) {
  if (path === '/api/auth/me' && req.method === 'GET') {
    const u = currentUser(req)
    return send(res, 200, { user: u ? publicUser(u) : null })
  }

  if (path === '/api/auth/register' && req.method === 'POST') {
    if (registerLimit(clientIp(req))) throw new ApiError(429, 'rate_limited')
    const b = await readJson(req)
    const email = str(b.email, 254).toLowerCase(), name = str(b.name, 80), password = typeof b.password === 'string' ? b.password : ''
    const phone = str(b.phone, 30)
    if (!validEmail(email) || name.length < 2 || (phone && !validPhone(phone))) throw new ApiError(400, 'invalid_input')
    if (password.length < 8 || password.length > 128) throw new ApiError(400, 'weak_password')
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) throw new ApiError(409, 'email_taken')
    const role = adminEmails().includes(email) ? 'admin' : 'customer'
    const { lastInsertRowid } = db.prepare('INSERT INTO users (email, name, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)').run(email, name, phone || null, await hashPassword(password), role)
    startSession(req, res, Number(lastInsertRowid))
    return send(res, 201, { user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(lastInsertRowid)) })
  }

  if (path === '/api/auth/login' && req.method === 'POST') {
    const b = await readJson(req)
    const email = str(b.email, 254).toLowerCase(), password = typeof b.password === 'string' ? b.password : ''
    if (loginLimit(`${clientIp(req)}|${email}`)) throw new ApiError(429, 'rate_limited')
    const u = db.prepare('SELECT * FROM users WHERE email = ?').get(email)
    // Always run a hash comparison so response time does not reveal whether the email exists.
    const ok = u ? await verifyPassword(password, u.password_hash) : (await verifyPassword(password, 'scrypt$AAAAAAAAAAAAAAAAAAAAAA==$' + 'A'.repeat(86) + '=='), false)
    if (!u || !ok) throw new ApiError(401, 'invalid_credentials')
    if (adminEmails().includes(email) && u.role !== 'admin') { db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(u.id); u.role = 'admin' }
    startSession(req, res, u.id)
    return send(res, 200, { user: publicUser(u) })
  }

  if (path === '/api/auth/logout' && req.method === 'POST') {
    const token = parseCookies(req.headers.cookie)[COOKIE]
    if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha(token))
    res.setHeader('Set-Cookie', cookie(req, COOKIE, '', 0))
    return send(res, 200, { ok: true })
  }

  if (path === '/api/auth/me' && req.method === 'PATCH') {
    const u = requireUser(req)
    const b = await readJson(req)
    const name = str(b.name, 80) || u.name, phone = str(b.phone, 30), city = str(b.city, 80), address = str(b.address, 300)
    if (name.length < 2 || (phone && !validPhone(phone))) throw new ApiError(400, 'invalid_input')
    db.prepare('UPDATE users SET name = ?, phone = ?, city = ?, address = ? WHERE id = ?').run(name, phone || null, city || null, address || null, u.id)
    return send(res, 200, { user: publicUser(db.prepare('SELECT * FROM users WHERE id = ?').get(u.id)) })
  }

  if (path === '/api/auth/password' && req.method === 'POST') {
    const u = requireUser(req)
    const b = await readJson(req)
    const cur = typeof b.current === 'string' ? b.current : '', next = typeof b.next === 'string' ? b.next : ''
    if (next.length < 8 || next.length > 128) throw new ApiError(400, 'weak_password')
    if (loginLimit(`pw|${u.id}`)) throw new ApiError(429, 'rate_limited')
    if (!(await verifyPassword(cur, u.password_hash))) throw new ApiError(401, 'invalid_credentials')
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(await hashPassword(next), u.id)
    // Sign out every other session after a password change.
    const keep = sha(parseCookies(req.headers.cookie)[COOKIE] ?? '')
    db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?').run(u.id, keep)
    return send(res, 200, { ok: true })
  }

  throw new ApiError(404, 'not_found')
}
