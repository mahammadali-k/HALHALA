import type { Key, TFn } from '@/i18n'
import { ApiError } from '@/lib/api'

/** Translates any thrown error from the API layer into a user-facing message. */
export function errorText(t: TFn, e: unknown): string {
  const code = e instanceof ApiError ? e.code : 'server'
  const key = `err.${code}` as Key
  const txt = t(key)
  return txt === key ? t('err.server') : txt
}
