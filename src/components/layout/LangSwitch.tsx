'use client'
import { LANGS, useI18n } from '@/i18n'

/** AZ | RU | EN segmented switch. The choice is remembered in localStorage. */
export function LangSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useI18n()
  return (
    <div role="group" aria-label={t('lang.label')} className={`flex items-center overflow-hidden rounded-full border border-line text-xs font-medium ${className}`}>
      {LANGS.map((l) => (
        <button
          key={l.id} type="button" lang={l.id} title={l.name} aria-pressed={lang === l.id} onClick={() => setLang(l.id)}
          className={`px-3 py-1.5 transition-colors ${lang === l.id ? 'bg-white text-ink' : 'text-muted hover:text-fg'}`}
        >{l.label}</button>
      ))}
    </div>
  )
}
