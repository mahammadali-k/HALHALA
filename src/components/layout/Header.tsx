'use client'
import { AnimatePresence, m } from 'motion/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { iconBtn } from '@/components/ui/styles'
import { BagIcon, MenuIcon, SearchIcon, UserIcon } from '@/components/ui/icons'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { sectionTag } from '@/data/nav'
import { useCatalog } from '@/context/CatalogContext'
import { useI18n } from '@/i18n'
import { LangSwitch } from './LangSwitch'
import { ThemeToggle } from './ThemeToggle'
import { DesktopNav, MobileNav } from './NavMenu'
import { Wordmark } from './Wordmark'


export function Header() {
  const { count, open: openCart } = useCart()
  const { t } = useI18n()
  const { user } = useAuth()
  const { store } = useCatalog()
  const router = useRouter()
  const path = usePathname()
  const [menu, setMenu] = useState(false)
  const [searching, setSearching] = useState(false)
  const [q, setQ] = useState('')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => { setMenu(false); setSearching(false) }, [path])
  useEffect(() => { if (searching) input.current?.focus() }, [searching])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    router.push(`/shop${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`)
    setQ('')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:bg-accent focus:px-3 focus:py-2 focus:text-ink">{t('skip')}</a>
      {/* design annotation strip: [ CURRENT SECTION ] … [ EST. YEAR ] */}
      <div className="container-x hidden items-center justify-between pt-2 md:flex">
        <span className="tag">[ {t(sectionTag(path))} ]</span>
        {store.est ? <span className="tag">[ {t('tag.est', { year: store.est })} ]</span> : <span />}
      </div>
      <div className="container-x grid h-16 grid-cols-[auto_1fr_auto] items-center gap-4 md:-mt-1 md:h-[3.75rem] lg:gap-6">
        <Link href="/" aria-label="HALHALA — home" className="shrink-0"><Wordmark /></Link>
        <div className="flex justify-center"><DesktopNav /></div>
        <div className="flex items-center gap-0.5">
          <LangSwitch className="mr-2 hidden sm:flex" />
          <ThemeToggle />
          <Link href={user ? '/account' : '/login'} className={iconBtn} aria-label={user ? `${t('acc.aria')}: ${user.name}` : t('acc.login')}>
            <UserIcon />
            {user && <span aria-hidden className="absolute right-1 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />}
          </Link>
          <button className={iconBtn} aria-label={t('search.open')} aria-expanded={searching} onClick={() => setSearching((s) => !s)}><SearchIcon /></button>
          <button className={iconBtn} aria-label={t('cart.aria', { n: count })} onClick={openCart}>
            <BagIcon />
            <AnimatePresence>
              {count > 0 && (
                <m.span key={count} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center bg-violet px-1 text-[0.6rem] text-on-violet tabular-nums">{count}</m.span>
              )}
            </AnimatePresence>
          </button>
          <button className={`${iconBtn} lg:hidden`} aria-label={t('menu.open')} onClick={() => setMenu(true)}><MenuIcon /></button>
        </div>
      </div>

      <AnimatePresence>
        {searching && (
          <m.form role="search" onSubmit={submit} initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-line">
            <div className="container-x py-3">
              <label className="sr-only" htmlFor="site-search">{t('search.label')}</label>
              <input id="site-search" ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search.placeholder')} className="field" />
            </div>
          </m.form>
        )}
      </AnimatePresence>

      <Drawer open={menu} onClose={() => setMenu(false)} title={t('menu.title')} side="right" footer={<div className="flex items-center gap-3"><LangSwitch className="w-fit" /><ThemeToggle /></div>}>
        <MobileNav onNavigate={() => setMenu(false)} />
      </Drawer>
    </header>
  )
}
