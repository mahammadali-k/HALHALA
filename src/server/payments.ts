import 'server-only'
import { createHash, timingSafeEqual } from 'node:crypto'

/**
 * Payment methods.
 *   cod  — pay on delivery (always available).
 *   card — online card payment through Epoint (https://epoint.az). Enabled when EPOINT_PUBLIC_KEY, EPOINT_PRIVATE_KEY
 *          and PUBLIC_URL are set. Contract per Epoint's developer docs (developer.epoint.az):
 *            POST {base}/api/1/request     form fields `data` (base64 JSON) + `signature`
 *            POST {base}/api/1/get-status  same encoding, payload {public_key, transaction}
 *            signature = base64(sha1_raw(private_key + data + private_key))
 *            result callback: POST to the Result URL set in the Epoint merchant cabinet, fields data + signature.
 */
const env = (k: string) => (process.env[k] ?? '').trim()
const base = () => env('EPOINT_BASE_URL') || 'https://epoint.az'
export const publicUrl = () => env('PUBLIC_URL').replace(/\/$/, '')
export const cardEnabled = () => Boolean(env('EPOINT_PUBLIC_KEY') && env('EPOINT_PRIVATE_KEY') && publicUrl())
export const paymentMethods = () => (cardEnabled() ? ['cod', 'card'] : ['cod'])
export const isPaymentMethod = (m: string) => paymentMethods().includes(m)

const sign = (data: string) => createHash('sha1').update(env('EPOINT_PRIVATE_KEY') + data + env('EPOINT_PRIVATE_KEY')).digest('base64')
const encode = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString('base64')

export function verifySignature(data: unknown, signature: unknown) {
  if (typeof data !== 'string' || typeof signature !== 'string') return false
  const want = Buffer.from(sign(data)), got = Buffer.from(signature)
  return want.length === got.length && timingSafeEqual(want, got)
}
export const decodeData = (data: string) => JSON.parse(Buffer.from(data, 'base64').toString('utf8')) as Record<string, unknown>

async function post(path: string, payload: unknown) {
  const data = encode(payload)
  const r = await fetch(base() + path, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ data, signature: sign(data) }), signal: AbortSignal.timeout(15_000),
  })
  const res = (await r.json().catch(() => null)) as Record<string, unknown> | null
  if (!res) throw new Error(`epoint ${r.status}`)
  return res
}

/** Starts a card payment. Returns the bank page URL to redirect the customer to. */
export async function createCardPayment(order: { number: string; total: number }, token: string, lang: string) {
  const res = await post('/api/1/request', {
    public_key: env('EPOINT_PUBLIC_KEY'),
    amount: (order.total / 100).toFixed(2),
    currency: 'AZN',
    language: ['az', 'en', 'ru'].includes(lang) ? lang : 'en',
    order_id: order.number,
    description: `HALHALA ${order.number}`,
    success_redirect_url: `${publicUrl()}/order/${order.number}?t=${token}&paid=1`,
    error_redirect_url: `${publicUrl()}/order/${order.number}?t=${token}&paid=0`,
  })
  if (res.status !== 'success' || typeof res.redirect_url !== 'string') throw new Error(`epoint: ${String(res.message ?? res.status)} (${String(res.trace_id ?? '-')})`)
  return { redirectUrl: res.redirect_url, transaction: typeof res.transaction === 'string' ? res.transaction : null }
}

/** Authoritative status from Epoint: success | failed | new | returned | error | server_error. */
export const fetchPaymentStatus = (transaction: string) => post('/api/1/get-status', { public_key: env('EPOINT_PUBLIC_KEY'), transaction })
