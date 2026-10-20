import { AnimatePresence, m } from 'motion/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'
import { useI18n } from '../i18n'
import { Drawer } from './Drawer'
import { LangSwitch } from './LangSwitch'
import { BagIcon, MenuIcon, SearchIcon, UserIcon } from './icons'
import { DesktopNav, MobileNav } from './NavMenu'
import { Wordmark } from './Wordmark'

const iconBtn = 'relative p-2 transition-colors hover:text-gold-deep'

export function Header() {
  const { count, open: openCart } = useCart()
  const { t } = useI18n()
  const { user } = useAuth()
  const { backend } = useCatalog()
  const [menu, setMenu] = useState(false)
  const [searching, setSearching] = useState(false)
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const { pathname } = useLocation()
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => { setMenu(false); setSearching(false) }, [pathname])
  useEffect(() => { if (searching) input.current?.focus() }, [searching])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    nav(`/shop${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`)
    setQ('')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:bg-gold focus:px-3 focus:py-2 focus:text-ink">{t('skip')}</a>
      <div className="container-x flex h-16 items-center gap-6">
        <button className={`${iconBtn} -ml-2 md:hidden`} aria-label={t('menu.open')} onClick={() => setMenu(true)}><MenuIcon /></button>
        <Link to="/" aria-label="HALHALA — home" className="shrink-0"><Wordmark /></Link>
        <div className="flex flex-1 justify-center"><DesktopNav /></div>
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <LangSwitch className="mr-2 hidden md:flex" />
          {backend === 'on' && (
            <Link to={user ? '/account' : '/login'} className={iconBtn} aria-label={user ? `${t('acc.aria')}: ${user.name}` : t('acc.login')}>
              <UserIcon />
              {user && <span aria-hidden className="absolute right-1 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />}
            </Link>
          )}
          <button className={iconBtn} aria-label={t('search.open')} aria-expanded={searching} onClick={() => setSearching((s) => !s)}><SearchIcon /></button>
          <button className={iconBtn} aria-label={t('cart.aria', { n: count })} onClick={openCart}>
            <BagIcon />
            <AnimatePresence>
              {count > 0 && (
                <m.span key={count} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center bg-burgundy px-1 text-[0.6rem] tabular-nums">{count}</m.span>
              )}
            </AnimatePresence>
          </button>
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

      <Drawer open={menu} onClose={() => setMenu(false)} title={t('menu.title')} side="left" footer={<LangSwitch className="w-fit" />}>
        <MobileNav onNavigate={() => setMenu(false)} />
      </Drawer>
    </header>
  )
}
