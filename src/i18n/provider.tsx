'use client'
import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { LANG_COOKIE, makeT, type Lang, type TFn } from './core'

interface Ctx { lang: Lang; setLang: (l: Lang) => void; t: TFn }
const I18n = createContext<Ctx | null>(null)

/** `initialLang` comes from the server (cookie / Accept-Language), so server and browser render the same text. */
export function I18nProvider({ initialLang, children }: { initialLang: Lang; children: ReactNode }) {
  const router = useRouter()
  const [lang, setLangState] = useState(initialLang)
  useEffect(() => setLangState(initialLang), [initialLang])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`
    router.refresh() // re-render Server Components (metadata, <html lang>) in the new language
  }, [router])

  const t = useMemo(() => makeT(lang), [lang])
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <I18n.Provider value={value}>{children}</I18n.Provider>
}

export function useI18n() {
  const c = useContext(I18n)
  if (!c) throw new Error('useI18n must be used inside <I18nProvider>')
  return c
}
