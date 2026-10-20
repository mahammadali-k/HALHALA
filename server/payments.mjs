// Payment methods.
//   cod   — pay on delivery (always available).
//   card  — online card payment through Epoint (https://epoint.az), enabled when EPOINT_PUBLIC_KEY, EPOINT_PRIVATE_KEY
//           and PUBLIC_URL are set. Contract per Epoint's developer docs (developer.epoint.az):
//             POST  {base}/api/1/request     form fields `data` (base64 JSON) + `signature`
//             POST  {base}/api/1/get-status  same encoding, payload {public_key, transaction}
//             signature = base64(sha1_raw(private_key + data + private_key))
//             result callback: POST to the Result URL configured in the Epoint merchant cabinet, fields data + signature.
import { createHash, timingSafeEqual } from 'node:crypto'

const env = (k) => (process.env[k] ?? '').trim()
const base = () => env('EPOINT_BASE_URL') || 'https://epoint.az'
export const publicUrl = () => env('PUBLIC_URL').replace(/\/$/, '')
export const cardEnabled = () => Boolean(env('EPOINT_PUBLIC_KEY') && env('EPOINT_PRIVATE_KEY') && publicUrl())
export const paymentMethods = () => (cardEnabled() ? ['cod', 'card'] : ['cod'])
export const isPaymentMethod = (m) => paymentMethods().includes(m)

const sign = (data) => createHash('sha1').update(env('EPOINT_PRIVATE_KEY') + data + env('EPOINT_PRIVATE_KEY')).digest('base64')
const encode = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64')

export function verifySignature(data, signature) {
  if (typeof data !== 'string' || typeof signature !== 'string') return false
  const want = Buffer.from(sign(data)), got = Buffer.from(signature)
  return want.length === got.length && timingSafeEqual(want, got)
}
export const decodeData = (data) => JSON.parse(Buffer.from(data, 'base64').toString('utf8'))

async function post(path, payload) {
  const data = encode(payload)
  const r = await fetch(base() + path, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ data, signature: sign(data) }), signal: AbortSignal.timeout(15_000),
  })
  const json = await r.json().catch(() => null)
  if (!json) throw new Error(`epoint ${r.status}`)
  return json
}

/** Starts a card payment for an order. Returns the bank page URL to redirect the customer to. */
export async function createCardPayment(order, token, lang) {
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
  if (res.status !== 'success' || !res.redirect_url) throw new Error(`epoint: ${res.message ?? res.status} (${res.trace_id ?? '-'})`)
  return { redirectUrl: res.redirect_url, transaction: res.transaction ?? null }
}

/** Asks Epoint for the authoritative status of a transaction: success | failed | new | returned | error | server_error. */
export async function fetchPaymentStatus(transaction) {
  return post('/api/1/get-status', { public_key: env('EPOINT_PUBLIC_KEY'), transaction })
}
