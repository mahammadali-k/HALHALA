import type { CartLine } from '../context/CartContext'
import type { TFn } from '../i18n'
import { formatPrice } from './format'

export interface CheckoutValues { name: string; phone: string; email: string; city: string; address: string; notes: string }
export type CheckoutErrors = Partial<Record<keyof CheckoutValues, string>>

export function validateCheckout(v: CheckoutValues, t: TFn): CheckoutErrors {
  const e: CheckoutErrors = {}
  if (v.name.trim().length < 2) e.name = t('v.name')
  const digits = v.phone.replace(/\D/g, '')
  if (!/^[+\d][\d\s()+-]*$/.test(v.phone.trim()) || digits.length < 7 || digits.length > 15) e.phone = t('v.phone')
  if (v.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = t('v.email')
  if (v.city.trim().length < 2) e.city = t('v.city')
  if (v.address.trim().length < 5) e.address = t('v.address')
  return e
}

/**
 * No order/payment API exists. This builds a plain-text order request that the customer
 * sends to the brand via Instagram or TikTok DM (the brand's current "Shop via DM" flow).
 */
export function buildOrderMessage(lines: CartLine[], total: number, v: CheckoutValues, t: TFn): string {
  const items = lines.map((l) => `• ${l.product.name} — ${l.item.size} × ${l.item.quantity} = ${formatPrice(l.subtotal)}`)
  return [
    t('ord.intro'),
    ...items,
    t('ord.total', { total: formatPrice(total) }),
    '',
    `${t('ord.name')}: ${v.name.trim()}`,
    `${t('ord.phone')}: ${v.phone.trim()}`,
    v.email.trim() !== '' && `${t('ord.email')}: ${v.email.trim()}`,
    `${t('ord.city')}: ${v.city.trim()}`,
    `${t('ord.address')}: ${v.address.trim()}`,
    v.notes.trim() !== '' && `${t('ord.notes')}: ${v.notes.trim()}`,
  ].filter((x) => x !== false).join('\n')
}
