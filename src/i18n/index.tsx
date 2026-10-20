import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { az } from './az'
import { en, type Key } from './en'
import { ru } from './ru'

export type Lang = 'az' | 'ru' | 'en'
export type Vars = Record<string, string | number>
export type TFn = (key: Key, vars?: Vars) => string
export type { Key }

export const LANGS: { id: Lang; label: string; name: string }[] = [
  { id: 'az', label: 'AZ', name: 'Azərbaycanca' },
  { id: 'ru', label: 'RU', name: 'Русский' },
  { id: 'en', label: 'EN', name: 'English' },
]

const dicts: Record<Lang, Record<Key, string>> = { en, az, ru }
const STORAGE = 'halhala.lang'

function initial(): Lang {
  try {
    const s = localStorage.getItem(STORAGE)
    if (s === 'az' || s === 'ru' || s === 'en') return s
  } catch { /* storage unavailable */ }
  const nav = (navigator.language || '').slice(0, 2).toLowerCase()
  return nav === 'az' || nav === 'ru' ? nav : 'en'
}

export const makeT = (lang: Lang): TFn => (key, vars) => {
  const raw = dicts[lang][key] ?? en[key] ?? key
  return vars ? raw.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`)) : raw
}

/** Typed helpers for ids that map to dictionary keys. */
export const colKey = (id: string, field: 'title' | 'blurb') => `col.${id}.${field}` as Key
export const prodKey = (id: string) => `prod.${id}.desc` as Key
export const catKey = (c: string) => `cat.${c}` as Key

interface Ctx { lang: Lang; setLang: (l: Lang) => void; t: TFn }
const I18n = createContext<Ctx | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial)
  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem(STORAGE, l) } catch { /* ignore */ }
  }, [])
  const t = useMemo(() => makeT(lang), [lang])
  useEffect(() => {
    document.documentElement.lang = lang
    document.title = t('meta.title')
  }, [lang, t])
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <I18n.Provider value={value}>{children}</I18n.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const c = useContext(I18n)
  if (!c) throw new Error('useI18n must be used inside <I18nProvider>')
  return c
}
