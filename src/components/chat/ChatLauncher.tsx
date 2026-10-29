'use client'
import { lazy, Suspense, useEffect, useState } from 'react'
import { useI18n } from '@/i18n'
import { onOpenChat } from '@/lib/contact'

// Chat code is only downloaded the first time someone opens it.
const ChatPanel = lazy(() => import('@/components/chat/ChatPanel'))

export function ChatLauncher() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  useEffect(() => onOpenChat(() => setOpen(true)), [])
  return (
    <>
      {open && <Suspense fallback={null}><ChatPanel onClose={() => setOpen(false)} /></Suspense>}
      <button
        onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? t('chat.close') : t('chat.open')}
        className="fixed bottom-5 right-5 z-50 flex h-14 items-center gap-2 border border-accent bg-violet px-5 text-xs uppercase tracking-[0.2em] shadow-xl shadow-black/40 transition-colors hover:bg-violet-hi active:scale-95"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M4 5h16v11H9l-5 4V5Z" strokeLinejoin="round" /></svg>
        <span className="hidden sm:inline">{t('chat.label')}</span>
      </button>
    </>
  )
}
