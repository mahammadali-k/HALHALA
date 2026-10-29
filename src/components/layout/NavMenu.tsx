'use client'
import { AnimatePresence, m } from 'motion/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Img } from '@/components/ui/Img'
import { nav, type NavItem } from '@/data/nav'
import { collections } from '@/data/products'
import { colKey, useI18n } from '@/i18n'

const Chevron = ({ open }: { open: boolean }) => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden className={`transition-transform ${open ? 'rotate-180' : ''}`}>
    <path d="m2 3.5 3 3 3-3" />
  </svg>
)

const isActive = (item: NavItem, path: string) =>
  item.to === '/' ? path === '/' : [item.to, ...(item.match ?? [])].some((p) => path === p || path.startsWith(`${p}/`))

const topCls = 'relative pb-1 font-mono text-[0.68rem] font-semibold uppercase tracking-[0.24em] transition-colors hover:text-accent-deep after:absolute after:inset-x-0 after:-bottom-px after:h-px after:origin-left after:scale-x-0 after:bg-accent after:transition-transform data-[active=true]:after:scale-x-100'

function DesktopItem({ item, active, open, onOpen, onClose }: { item: NavItem; active: boolean; open: boolean; onOpen: () => void; onClose: () => void }) {
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
      <div className="flex items-center gap-1.5 py-6">
        <Link href={item.to} data-active={active} aria-current={active ? 'page' : undefined} className={topCls}>{t(item.label)}</Link>
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
                    <Link href={c.to} onClick={onClose} className="block px-3 py-2.5 transition-colors hover:bg-card">
                      <span className="block text-sm">{t(c.label)}</span>
                      {c.hint && <span className="block text-xs text-muted">{t(c.hint)}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
              {feature && (
                <Link href={`/shop?collection=${feature.id}`} onClick={onClose} className="relative m-3 ml-0 block overflow-hidden">
                  <Img image={feature.image} ratio="h-full min-h-44" sizes="176px" />
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 to-transparent p-3 font-mono text-xs uppercase tracking-widest">{t(colKey(feature.id, 'title'))}</span>
                </Link>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </li>
  )
}

/** Desktop navigation (≥ lg). Hover or focus opens the sub-menu; Esc closes it. */
export function DesktopNav() {
  const [open, setOpen] = useState<string | null>(null)
  const path = usePathname()
  const timer = useRef(0)
  useEffect(() => setOpen(null), [path])
  const show = (id: string) => { window.clearTimeout(timer.current); setOpen(id) }
  const hide = (id: string) => { window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setOpen((o) => (o === id ? null : o)), 120) }
  return (
    <nav aria-label="Primary" className="hidden lg:block">
      <ul className="flex items-center gap-9">
        {nav.map((item) => (
          <DesktopItem key={item.to} item={item} active={isActive(item, path)} open={open === item.to} onOpen={() => show(item.to)} onClose={() => hide(item.to)} />
        ))}
      </ul>
    </nav>
  )
}

/** Mobile / tablet menu: native <details> accordions — accessible without extra JS state. */
export function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  const { t } = useI18n()
  const path = usePathname()
  return (
    <nav aria-label="Mobile">
      {nav.map((item) => !item.children ? (
        <Link key={item.to} href={item.to} onClick={onNavigate} aria-current={isActive(item, path) ? 'page' : undefined} className="block border-b border-line py-4 font-display text-xl font-black uppercase hover:text-accent-deep aria-[current=page]:text-accent">{t(item.label)}</Link>
      ) : (
        <details key={item.to} className="group border-b border-line">
          <summary className="flex cursor-pointer list-none items-center justify-between py-4 font-display text-xl font-black uppercase marker:hidden [&::-webkit-details-marker]:hidden">
            {t(item.label)}<span className="text-accent"><Chevron open={false} /></span>
          </summary>
          <ul className="pb-4">
            {item.children.map((c) => (
              <li key={c.to + c.label}><Link href={c.to} onClick={onNavigate} className="block py-2 pl-3 text-sm text-muted hover:text-fg">{t(c.label)}</Link></li>
            ))}
          </ul>
        </details>
      ))}
    </nav>
  )
}
