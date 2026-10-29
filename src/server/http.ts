import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'

export class ApiError extends Error {
  status: number
  code: string
  extra?: Record<string, unknown>
  constructor(status: number, code: string, extra?: Record<string, unknown>) { super(code); this.status = status; this.code = code; this.extra = extra }
}

export const json = (data: unknown, status = 200, headers?: HeadersInit) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } })

export const text = (body: string, status = 200, headers?: HeadersInit) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...headers } })

// ---------------------------------------------------------------- request helpers
export const clientIp = (req: Request) => req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'
export const isHttps = (req: Request) => req.headers.get('x-forwarded-proto') === 'https' || new URL(req.url).protocol === 'https:' || process.env.COOKIE_SECURE === '1'

export async function readJson<T = Record<string, unknown>>(req: Request, limit = 64 * 1024): Promise<T> {
  const raw = await req.text()
  if (raw.length > limit) throw new ApiError(413, 'too_large')
  if (!raw) return {} as T
  try { return JSON.parse(raw) as T } catch { throw new ApiError(400, 'invalid_input') }
}

export const readForm = async (req: Request): Promise<Record<string, string>> => Object.fromEntries(new URLSearchParams(await req.text()))

// ---------------------------------------------------------------- CSRF / origin
/** Hosts that may legitimately send browser requests: this server, a proxy in front of it, PUBLIC_URL and ALLOWED_ORIGINS. */
function trustedHosts(req: Request) {
  const hosts = new Set<string>()
  const add = (h?: string | null) => { if (h) hosts.add(h) }
  add(req.headers.get('host')); add(req.headers.get('x-forwarded-host')); add(new URL(req.url).host)
  for (const u of [process.env.PUBLIC_URL, ...(process.env.ALLOWED_ORIGINS ?? '').split(',')]) {
    try { if (u?.trim()) add(new URL(u.trim()).host) } catch { /* ignore malformed entry */ }
  }
  return hosts
}
export function assertOriginIfPresent(req: Request) {
  const origin = req.headers.get('origin')
  if (!origin) return
  let host: string
  try { host = new URL(origin).host } catch { throw new ApiError(403, 'forbidden') }
  if (!trustedHosts(req).has(host)) throw new ApiError(403, 'forbidden')
}
/**
 * State-changing requests must carry a custom header (cannot be sent cross-site without CORS) and a trusted Origin.
 * The session cookie is SameSite=Lax as a third layer.
 */
function assertSameOrigin(req: Request) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return
  if (req.headers.get('x-requested-with') !== 'halhala') throw new ApiError(403, 'forbidden')
  assertOriginIfPresent(req)
}

// ---------------------------------------------------------------- route wrapper
type Params = Record<string, string>
type Handler<P extends Params> = (req: NextRequest, params: P) => Promise<Response> | Response

/**
 * Wraps a Route Handler: CSRF check, async params, and one place that turns ApiError into JSON.
 * `{ csrf: false }` is for server-to-server calls (payment gateway callback) and the streaming chat (origin-checked inside).
 */
export function route<P extends Params = Params>(handler: Handler<P>, opts: { csrf?: boolean } = {}) {
  return async (req: NextRequest, ctx?: { params: Promise<P> }): Promise<Response> => {
    try {
      if (opts.csrf !== false) assertSameOrigin(req)
      return await handler(req, (await ctx?.params) ?? ({} as P))
    } catch (e) {
      if (e instanceof ApiError) return json({ error: e.code, ...(e.extra ?? {}) }, e.status)
      console.error('[api]', req.method, new URL(req.url).pathname, e)
      return json({ error: 'server' }, 500)
    }
  }
}

// ---------------------------------------------------------------- rate limiting (in-memory, per server process)
/** Sliding window: returns true when `key` exceeded `max` hits within `windowMs`. */
export function limiter(max: number, windowMs: number) {
  const hits = new Map<string, number[]>()
  return (key: string) => {
    const now = Date.now()
    const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
    arr.push(now)
    hits.set(key, arr)
    if (hits.size > 10_000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k)
    return arr.length > max
  }
}
export const assertNotLimited = (limited: boolean) => { if (limited) throw new ApiError(429, 'rate_limited') }

// ---------------------------------------------------------------- CSV
/** UTF-8 BOM CSV (Excel-friendly); cells starting with = + - @ are prefixed to neutralise spreadsheet formulas. */
export function csvResponse(filename: string, headers: string[], rows: unknown[][]) {
  const cell = (v: unknown) => {
    let s = v === null || v === undefined ? '' : String(v)
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
    return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const body = '﻿' + [headers, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')
  return new Response(body, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store' } })
}
