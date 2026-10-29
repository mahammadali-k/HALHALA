import type { TFn } from '@/i18n'
import type { CheckoutContact } from '@/types/api'
import { isEmail, isPhone } from './validate'

export type CheckoutErrors = Partial<Record<keyof CheckoutContact, string>>

/** Client-side form validation (the server repeats it with the same rules from lib/validate). */
export function validateCheckout(v: CheckoutContact, t: TFn): CheckoutErrors {
  const e: CheckoutErrors = {}
  if (v.name.trim().length < 2) e.name = t('v.name')
  if (!isPhone(v.phone)) e.phone = t('v.phone')
  if (v.email.trim() && !isEmail(v.email.trim())) e.email = t('v.email')
  if (v.city.trim().length < 2) e.city = t('v.city')
  if (v.address.trim().length < 5) e.address = t('v.address')
  return e
}
