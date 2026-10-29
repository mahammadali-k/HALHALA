/** Validation shared by the browser forms and the API (one definition, so they can never disagree). */
export const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254
export const isPhone = (p: string) => {
  const digits = p.replace(/\D/g, '')
  return /^[+\d][\d\s()+-]*$/.test(p.trim()) && digits.length >= 7 && digits.length <= 15
}
/** Last 7 digits — used to match a phone number regardless of formatting / country prefix. */
export const phoneTail = (p: string) => p.replace(/\D/g, '').slice(-7)
/** Trimmed string capped at `max` characters ('' for non-strings). */
export const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/** Redirect targets must stay inside this site (blocks open redirects such as `//evil.example`). */
export const safeNext = (n: unknown, fallback = '/account') => (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n : fallback)
