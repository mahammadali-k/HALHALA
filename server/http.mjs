// Small HTTP helpers shared by the API modules.
export class ApiError extends Error {
  constructor(status, code, extra) { super(code); this.status = status; this.code = code; this.extra = extra }
}

export const send = (res, status, obj, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers })
  res.end(JSON.stringify(obj))
}

export function readJson(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (d) => {
      size += d.length
      if (size > limit) { reject(new ApiError(413, 'too_large')); req.destroy() } else chunks.push(d)
    })
    req.on('end', () => {
      if (!chunks.length) return resolve({})
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) } catch { reject(new ApiError(400, 'invalid_input')) }
    })
    req.on('error', reject)
  })
}

export const parseCookies = (header = '') =>
  Object.fromEntries(header.split(';').map((c) => c.trim()).filter(Boolean).map((c) => { const i = c.indexOf('='); return [c.slice(0, i), decodeURIComponent(c.slice(i + 1))] }))

export const isHttps = (req) => Boolean(req.socket.encrypted) || req.headers['x-forwarded-proto'] === 'https' || process.env.COOKIE_SECURE === '1'

export const cookie = (req, name, value, maxAgeSec) =>
  `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${isHttps(req) ? '; Secure' : ''}`

export const clientIp = (req) => req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.socket.remoteAddress || 'unknown'

/** Sliding-window limiter: returns true when `key` exceeded `max` hits within `windowMs`. */
export function limiter(max, windowMs) {
  const hits = new Map()
  return (key) => {
    const now = Date.now()
    const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
    arr.push(now)
    hits.set(key, arr)
    if (hits.size > 10_000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k)
    return arr.length > max
  }
}

/** Hosts that may legitimately send browser requests: this server, the proxy in front of it, PUBLIC_URL and ALLOWED_ORIGINS. */
function trustedHosts(req) {
  const hosts = new Set([req.headers.host, req.headers['x-forwarded-host']].filter(Boolean))
  for (const u of [process.env.PUBLIC_URL, ...(process.env.ALLOWED_ORIGINS ?? '').split(',')]) {
    try { if (u?.trim()) hosts.add(new URL(u.trim()).host) } catch { /* ignore malformed entry */ }
  }
  return hosts
}

/** Throws unless the request's Origin (when present) belongs to a trusted host. */
export function assertOriginIfPresent(req) {
  const origin = req.headers.origin
  if (!origin) return
  let host
  try { host = new URL(origin).host } catch { throw new ApiError(403, 'forbidden') }
  if (!trustedHosts(req).has(host)) throw new ApiError(403, 'forbidden')
}

/**
 * CSRF defence for state-changing requests: the session cookie is SameSite=Lax, and we additionally
 * require a custom header (cannot be sent cross-site without CORS) and a trusted Origin when present.
 */
export function assertSameOrigin(req) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return
  if (req.headers['x-requested-with'] !== 'halhala') throw new ApiError(403, 'forbidden')
  assertOriginIfPresent(req)
}

/** Reads an application/x-www-form-urlencoded body (used by the payment gateway callback). */
export function readForm(req, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (d) => { size += d.length; if (size > limit) { reject(new ApiError(413, 'too_large')); req.destroy() } else chunks.push(d) })
    req.on('end', () => resolve(Object.fromEntries(new URLSearchParams(Buffer.concat(chunks).toString('utf8')))))
    req.on('error', reject)
  })
}

export const sendText = (res, status, text, headers = {}) => {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...headers })
  res.end(text)
}

/** CSV with a UTF-8 BOM (Excel-friendly). Cells starting with = + - @ are prefixed to neutralise spreadsheet formulas. */
export function toCsv(headers, rows) {
  const cell = (v) => {
    let s = v === null || v === undefined ? '' : String(v)
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
    return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return '\ufeff' + [headers, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')
}
