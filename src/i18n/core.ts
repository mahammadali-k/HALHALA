import { az } from './az'
import { en, type Key } from './en'
import { ru } from './ru'

/** Framework-free i18n core (usable in Server Components, Route Handlers and the browser). */
export type Lang = 'az' | 'ru' | 'en'
export type Vars = Record<string, string | number>
export type TFn = (key: Key, vars?: Vars) => string
export type { Key }

export const LANGS: { id: Lang; label: string; name: string }[] = [
  { id: 'az', label: 'AZ', name: 'Azərbaycanca' },
  { id: 'ru', label: 'RU', name: 'Русский' },
  { id: 'en', label: 'EN', name: 'English' },
]
export const LANG_COOKIE = 'lang'
export const isLang = (v: unknown): v is Lang => v === 'az' || v === 'ru' || v === 'en'

const dicts: Record<Lang, Record<Key, string>> = { en, az, ru }

export const makeT = (lang: Lang): TFn => (key, vars) => {
  const raw = dicts[lang][key] ?? en[key] ?? key
  return vars ? raw.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`)) : raw
}

/** Typed helpers for ids that map to dictionary keys. */
export const colKey = (id: string, field: 'title' | 'blurb') => `col.${id}.${field}` as Key
export const prodKey = (id: string) => `prod.${id}.desc` as Key
export const catKey = (c: string) => `cat.${c}` as Key

