import { AnimatePresence, m } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { collections } from '../data/products'
import { colKey, useI18n } from '../i18n'
import { nav, type NavItem } from '../data/nav'
import { Img } from './Img'

const Chevron = ({ open }: { open: boolean }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden className={`transition-transform ${open ? 'rotate-180' : ''}`}>
    <path d="m2 3.5 3 3 3-3" />
  </svg>
)

const topCls = 'relative pb-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] transition-colors hover:text-accent-deep after:absolute after:inset-x-0 after:-bottom-px after:h-px after:origin-left after:scale-x-0 after:bg-accent after:transition-transform aria-[current=page]:after:scale-x-100'

function DesktopItem({ item, open, onOpen, onClose }: { item: NavItem; open: boolean; onOpen: () => void; onClose: () => void }) {
  const { t } = useI18n()
  const feature = collections.find((c) => c.id === item.feature)
  return (
    <li
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) onClose() }}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
    >
      <div className="flex items-center gap-1.5 py-5">
        <NavLink to={item.to} end={item.to === '/'} className={topCls}>{t(item.label)}</NavLink>
        {item.children && (
          <button type="button" aria-label={t('nav.menuFor', { name: t(item.label) })} aria-expanded={open} aria-haspopup="true" onClick={() => (open ? onClose() : onOpen())} className="p-1 text-muted hover:text-accent-deep">
            <Chevron open={open} />
          </button>
        )}
      </div>
      <AnimatePresence>
        {open && item.children && (
          <m.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.16 }}
            className="absolute left-1/2 top-full z-50 w-[30rem] -translate-x-1/2 border border-line bg-ink-2 shadow-2xl shadow-black/40"
          >
            <div className={`grid ${feature ? 'grid-cols-[1fr_11rem]' : ''}`}>
              <ul className="p-3">
                {item.children.map((c) => (
                  <li key={c.to + c.label}>
                    <Link to={c.to} onClick={onClose} className="block px-3 py-2.5 transition-colors hover:bg-card">
                      <span className="block text-sm">{t(c.label)}</span>
                      {c.hint && <span className="block text-xs text-muted">{t(c.hint)}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
              {feature && (
                <Link to={`/shop?collection=${feature.id}`} onClick={onClose} className="relative m-3 ml-0 block overflow-hidden">
                  <Img image={feature.image} ratio="h-full min-h-44" sizes="176px" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent p-3 text-xs uppercase tracking-widest">{t(colKey(feature.id, 'title'))}</span>
                </Link>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </li>
  )
}

export function DesktopNav() {
  const [open, setOpen] = useState<string | null>(null)
  const { pathname, search } = useLocation()
  const t = useRef<number>(0)
  useEffect(() => setOpen(null), [pathname, search])
  const show = (label: string) => { window.clearTimeout(t.current); setOpen(label) }
  const hide = (label: string) => { window.clearTimeout(t.current); t.current = window.setTimeout(() => setOpen((o) => (o === label ? null : o)), 120) }
  return (
    <nav aria-label="Primary" className="hidden md:block">
      <ul className="flex items-center gap-8">
        {nav.map((item) => (
          <DesktopItem key={item.to} item={item} open={open === item.to} onOpen={() => show(item.to)} onClose={() => hide(item.to)} />
        ))}
      </ul>
    </nav>
  )
}

/** Mobile menu: native <details> accordions — accessible without extra JS state. */
export function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const { t } = useI18n()
  return (
    <nav aria-label="Mobile">
      {nav.map((item) => !item.children ? (
        <Link key={item.to} to={item.to} onClick={onNavigate} className="block border-b border-line py-4 font-display text-2xl uppercase hover:text-accent-deep">{t(item.label)}</Link>
      ) : (
        <details key={item.to} className="group border-b border-line">
          <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-display text-2xl uppercase marker:hidden [&::-webkit-details-marker]:hidden">
            {t(item.label)}<span className="text-accent text-lg"><Chevron open={false} /></span>
          </summary>
          <ul className="pb-4">
            {item.children?.map((c) => (
              <li key={c.to + c.label}>
                <Link to={c.to} onClick={onNavigate} className="block py-2 pl-3 text-sm text-muted hover:text-fg">{t(c.label)}</Link>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </nav>
  )
}
