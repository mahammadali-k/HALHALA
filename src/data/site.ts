import type { StoreSettings } from '@/types/api'

/** Static brand constants (never edited at runtime). */
export const site = {
  name: 'HALHALA',
  tagline: 'The mountain goat is up high',
  currency: 'AZN',
} as const

const none = { az: '', ru: '', en: '' }

/**
 * DEFAULTS of the store settings. The live values are edited in the admin panel (Settings tab) and stored in the
 * database; anything the admin has not filled in falls back to these. Empty text = "not published yet" in the UI.
 */
export const DEFAULT_STORE: StoreSettings = {
  email: '',
  phone: '',
  address: '',
  instagramHandle: 'halhala.az',
  tiktokUrl: 'https://www.tiktok.com/@halhala.az',
  est: '2024',
  deliveryFee: Number(process.env.DELIVERY_FEE_AZN) || 0,
  freeDeliveryFrom: process.env.FREE_DELIVERY_FROM_AZN ? Number(process.env.FREE_DELIVERY_FROM_AZN) : null,
  policies: { delivery: { ...none }, returns: { ...none }, privacy: { ...none }, terms: { ...none } },
}
