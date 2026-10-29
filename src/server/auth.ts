import 'server-only'
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import { cookies } from 'next/headers'
import type { NextRequest, NextResponse } from 'next/server'
import { clean, isEmail, isPhone } from '@/lib/validate'
import type { User } from '@/types/api'
import { one, run, type UserDbRow } from './db'
import { ApiError, assertNotLimited, clientIp, isHttps, limiter, readJson } from './http'

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>
export const SESSION_COOKIE = 'hh_session'
const SESSION_DAYS = 30
const registerLimit = limiter(10, 3600_000)
const loginLimit = limiter(10, 15 * 60_000)
const adminEmails = () => (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
const sha = (s: string) => createHash('sha256').update(s).digest('hex')

// ---------------------------------------------------------------- passwords
export async function hashPassword(pw: string) {
  const salt = randomBytes(16)
  return `scrypt$${salt.toString('base64')}$${(await scrypt(pw, salt, 64)).toString('base64')}`
}
async function verifyPassword(pw: string, stored: string) {
  const [alg, salt, hash] = stored.split('$')
  if (alg !== 'scrypt') return false
  const key = await scrypt(pw, Buffer.from(salt, 'base64'), 64)
  const want = Buffer.from(hash, 'base64')
  return key.length === want.length && timingSafeEqual(key, want)
}
// Compared against when the email is unknown, so response time does not reveal whether an account exists.
const DUMMY_HASH = `scrypt$${Buffer.alloc(16).toString('base64')}$${Buffer.alloc(64).toString('base64')}`

export const publicUser = (u: UserDbRow): User => ({ id: u.id, email: u.email, name: u.name, phone: u.phone ?? '', city: u.city ?? '', address: u.address ?? '', role: u.role })

// ---------------------------------------------------------------- sessions
function userFromToken(token?: string): UserDbRow | null {
  if (!token) return null
  const row = one<UserDbRow & { expires_at: number }>('SELECT u.*, s.expires_at FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?', sha(token))
  if (!row) return null
  if (row.expires_at < Date.now()) { run('DELETE FROM sessions WHERE token_hash = ?', sha(token)); return null }
  return row
}
export const userFromRequest = (req: NextRequest) => userFromToken(req.cookies.get(SESSION_COOKIE)?.value)
/** For Server Components / layouts. */
export const getSessionUser = async () => { const u = userFromToken((await cookies()).get(SESSION_COOKIE)?.value); return u ? publicUser(u) : null }

export function requireUser(req: NextRequest) { const u = userFromRequest(req); if (!u) throw new ApiError(401, 'unauthorized'); return u }
export function requireAdmin(req: NextRequest) { const u = requireUser(req); if (u.role !== 'admin') throw new ApiError(403, 'forbidden'); return u }

function startSession(res: NextResponse, req: Request, userId: number) {
  const token = randomBytes(32).toString('base64url')
  run('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)', sha(token), userId, Date.now() + SESSION_DAYS * 864e5)
  setCookie(res, req, token, SESSION_DAYS * 86400)
}
const setCookie = (res: NextResponse, req: Request, value: string, maxAge: number) =>
  res.cookies.set(SESSION_COOKIE, value, { httpOnly: true, sameSite: 'lax', path: '/', maxAge, secure: isHttps(req) })

// ---------------------------------------------------------------- use-cases (called by the route handlers)
export async function register(req: NextRequest, res: NextResponse) {
  assertNotLimited(registerLimit(clientIp(req)))
  const b = await readJson(req)
  const email = clean(b.email, 254).toLowerCase(), name = clean(b.name, 80), phone = clean(b.phone, 30)
  const password = typeof b.password === 'string' ? b.password : ''
  if (!isEmail(email) || name.length < 2 || (phone && !isPhone(phone))) throw new ApiError(400, 'invalid_input')
  if (password.length < 8 || password.length > 128) throw new ApiError(400, 'weak_password')
  if (one('SELECT 1 FROM users WHERE email = ?', email)) throw new ApiError(409, 'email_taken')
  const role = adminEmails().includes(email) ? 'admin' : 'customer'
  const { lastInsertRowid } = run('INSERT INTO users (email, name, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)', email, name, phone || null, await hashPassword(password), role)
  startSession(res, req, Number(lastInsertRowid))
  return publicUser(one<UserDbRow>('SELECT * FROM users WHERE id = ?', Number(lastInsertRowid))!)
}

export async function login(req: NextRequest, res: NextResponse) {
  const b = await readJson(req)
  const email = clean(b.email, 254).toLowerCase(), password = typeof b.password === 'string' ? b.password : ''
  assertNotLimited(loginLimit(`${clientIp(req)}|${email}`))
  const u = one<UserDbRow>('SELECT * FROM users WHERE email = ?', email)
  const ok = await verifyPassword(password, u?.password_hash ?? DUMMY_HASH)
  if (!u || !ok) throw new ApiError(401, 'invalid_credentials')
  if (adminEmails().includes(email) && u.role !== 'admin') { run("UPDATE users SET role = 'admin' WHERE id = ?", u.id); u.role = 'admin' }
  startSession(res, req, u.id)
  return publicUser(u)
}

export function logout(req: NextRequest, res: NextResponse) {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (token) run('DELETE FROM sessions WHERE token_hash = ?', sha(token))
  setCookie(res, req, '', 0)
}

export async function updateProfile(req: NextRequest) {
  const u = requireUser(req)
  const b = await readJson(req)
  const name = clean(b.name, 80) || u.name, phone = clean(b.phone, 30), city = clean(b.city, 80), address = clean(b.address, 300)
  if (name.length < 2 || (phone && !isPhone(phone))) throw new ApiError(400, 'invalid_input')
  run('UPDATE users SET name = ?, phone = ?, city = ?, address = ? WHERE id = ?', name, phone || null, city || null, address || null, u.id)
  return publicUser(one<UserDbRow>('SELECT * FROM users WHERE id = ?', u.id)!)
}

export async function changePassword(req: NextRequest) {
  const u = requireUser(req)
  const b = await readJson(req)
  const current = typeof b.current === 'string' ? b.current : '', next = typeof b.next === 'string' ? b.next : ''
  if (next.length < 8 || next.length > 128) throw new ApiError(400, 'weak_password')
  assertNotLimited(loginLimit(`pw|${u.id}`))
  if (!(await verifyPassword(current, u.password_hash))) throw new ApiError(401, 'invalid_credentials')
  run('UPDATE users SET password_hash = ? WHERE id = ?', await hashPassword(next), u.id)
  // every other session of this user is signed out
  run('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?', u.id, sha(req.cookies.get(SESSION_COOKIE)?.value ?? ''))
}

