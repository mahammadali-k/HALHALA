import 'server-only'
import { DEFAULT_STORE } from '@/data/site'
import { clean, isEmail, isPhone } from '@/lib/validate'
import { POLICY_KINDS, type StoreSettings } from '@/types/api'
import { requireAdmin } from './auth'
import { one, run } from './db'
import { ApiError, readJson } from './http'
import type { NextRequest } from 'next/server'

const KEY = 'store'
const LANGS = ['az', 'ru', 'en'] as const

/** Stored settings merged over the defaults (new fields added later always have a value). */
export function getStore(): StoreSettings {
  let saved: Partial<StoreSettings> = {}
  try { saved = JSON.parse(one<{ value: string }>('SELECT value FROM settings WHERE key = ?', KEY)?.value ?? '{}') } catch { /* corrupted → defaults */ }
  return { ...DEFAULT_STORE, ...saved, policies: { ...DEFAULT_STORE.policies, ...saved.policies } }
}

export async function updateStore(req: NextRequest): Promise<StoreSettings> {
  requireAdmin(req)
  const b = await readJson<Record<string, unknown>>(req, 200 * 1024)
  const cur = getStore()
  const email = clean(b.email, 254), phone = clean(b.phone, 30), handle = clean(b.instagramHandle, 30).replace(/^@/, '')
  const tiktok = clean(b.tiktokUrl, 200), est = clean(b.est, 4)
  if (email && !isEmail(email)) throw new ApiError(400, 'invalid_input', { fields: { email: 'email' } })
  if (phone && !isPhone(phone)) throw new ApiError(400, 'invalid_input', { fields: { phone: 'phone' } })
  if (!/^[A-Za-z0-9._]{1,30}$/.test(handle)) throw new ApiError(400, 'invalid_input', { fields: { instagramHandle: 'handle' } })
  if (tiktok && !/^https:\/\/(www\.)?tiktok\.com\/[@\w./-]+$/i.test(tiktok)) throw new ApiError(400, 'invalid_input', { fields: { tiktokUrl: 'url' } })
  if (est && !/^\d{4}$/.test(est)) throw new ApiError(400, 'invalid_input', { fields: { est: 'year' } })
  const fee = Number(b.deliveryFee ?? cur.deliveryFee), free = b.freeDeliveryFrom === null || b.freeDeliveryFrom === '' ? null : Number(b.freeDeliveryFrom)
  if (!Number.isFinite(fee) || fee < 0 || fee > 1000 || (free !== null && (!Number.isFinite(free) || free < 0))) throw new ApiError(400, 'invalid_input', { fields: { deliveryFee: 'number' } })

  const incoming = (b.policies ?? {}) as Record<string, Record<string, unknown>>
  const policies = Object.fromEntries(POLICY_KINDS.map((k) => [k, Object.fromEntries(LANGS.map((l) => [l, clean(incoming[k]?.[l], 20000)]))])) as StoreSettings['policies']

  const next: StoreSettings = { email, phone, address: clean(b.address, 300), instagramHandle: handle, tiktokUrl: tiktok, est, deliveryFee: fee, freeDeliveryFrom: free, policies }
  run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', KEY, JSON.stringify(next))
  return next
}
