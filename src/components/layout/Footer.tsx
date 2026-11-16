'use client'
import Link from 'next/link'
import { MountainBackdrop } from '@/components/ui/MountainBackdrop'
import { mutedLink } from '@/components/ui/styles'
import { shopLinks } from '@/data/nav'
import { useCatalog } from '@/context/CatalogContext'
import { site } from '@/data/site'
import { useI18n } from '@/i18n'
import { instagramUrl } from '@/lib/store'
import { Wordmark } from './Wordmark'
import { ButtonLink } from '@/components/ui/Button'
import { whatsappUrl } from '@/lib/store'

const SocialLink = ({ href, name, children }: { href: string; name: string; children: React.ReactNode }) => {
  const { t } = useI18n()
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={t('social.aria', { name })} title={name}
      className="grid h-12 w-12 place-items-center rounded-full border border-line text-fg transition-colors hover:border-violet hover:bg-violet/30">{children}</a>
  )
}
const InstagramLogo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4.2" /><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" /></svg>
)
const TikTokLogo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M16.6 3c.3 2.4 1.7 3.9 4 4.1v3a7.4 7.4 0 0 1-4-1.2v6.2a6 6 0 1 1-6-6c.3 0 .6 0 .9.1v3.2a2.9 2.9 0 1 0 2 2.7V3h3.1Z" /></svg>
)

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold text-fg">{title}</h2>
      <ul className="space-y-2">{children}</ul>
    </div>
  )
}

const YEAR = new Date().getFullYear()

// cotton boll · truck · shield · hanger
const ICONS = {
  cotton: 'M16 27V15M10 15a5 5 0 1 1 4-8 5 5 0 0 1 8 0 5 5 0 1 1 4 8c0 3-4 3-4 3s-2 2-6 2-6-2-6-2-4 0-4-3Z',
  truck: 'M3 8h15v13H3zM18 12h6l4 4v5h-10zM8 24a2 2 0 1 0 0-.01M23 24a2 2 0 1 0 0-.01',
  shield: 'M16 3 6 7v8c0 6 4 11 10 14 6-3 10-8 10-14V7L16 3Zm-4 12 3 3 6-6',
  hanger: 'M16 11a3 3 0 1 0-3-3M16 11v3L4 22h24L16 14',
}

/** Perks from the design brief (100% cotton, free delivery in Baku, …) — confirm them before launch. */
function Perks() {
  const { t } = useI18n()
  const items = [
    { icon: ICONS.cotton, title: t('perk.cotton') },
    { icon: ICONS.truck, title: t('perk.delivery'), sub: t('perk.delivery.sub') },
    { icon: ICONS.shield, title: t('perk.pay') },
    { icon: ICONS.hanger, title: t('perk.sizes') },
  ]
  return (
    <ul className="grid grid-cols-2 divide-x divide-line border-y border-line sm:grid-cols-4 sm:border-y-0 lg:border-y-0">
      {items.map((i) => (
        <li key={i.title} className="flex flex-col items-center gap-2 px-3 py-5 text-center text-accent first:border-r-0 sm:py-0">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={i.icon} /></svg>
          <span className="text-xs font-medium leading-4">{i.title}{i.sub && <><br /><span className="text-muted">{i.sub}</span></>}</span>
        </li>
      ))}
    </ul>
  )
}

export function Footer() {
  const { t } = useI18n()
  const { store, channels } = useCatalog()
  return (
    <footer className="mt-24 border-t border-line">
      <div className="relative isolate overflow-hidden border-b border-line">
        <MountainBackdrop />
        <div className="container-x grid items-center gap-8 py-10 lg:grid-cols-[auto_1fr_auto] lg:gap-12">
          <Wordmark className="!text-5xl text-accent" />
          <div>
            <p className="text-lg font-light">{t('footer.slogan')}</p>
            <p className="tag mt-3">{store.est ? t('tag.est', { year: store.est }) : ''}</p>
          </div>
          <Perks />
        </div>
      </div>

      <div className="border-b border-line bg-card">
        <div className="container-x flex flex-col items-center gap-5 py-10 text-center">
          <h2 className="display text-h2">{t('create.title')}</h2>
          <p className="max-w-md text-muted">{t('create.text')}</p>
          {store.whatsapp && (
            <ButtonLink href={`${whatsappUrl(store)}?text=${encodeURIComponent(t('msg.create'))}`} target="_blank" rel="noopener noreferrer" className="!px-9 !py-4">{t('create.cta')}</ButtonLink>
          )}
        </div>
      </div>

      <div className="container-x grid gap-10 pb-14 pt-12 sm:grid-cols-2 lg:grid-cols-4">
        <Column title={t('footer.shop')}>{shopLinks.map((l) => <li key={l.to}><Link className={mutedLink} href={l.to}>{t(l.label)}</Link></li>)}</Column>
        <Column title={t('footer.help')}>
          <li><Link className={mutedLink} href="/info#delivery">{t('footer.delivery')}</Link></li>
          <li><Link className={mutedLink} href="/info#returns">{t('footer.returns')}</Link></li>
          <li><Link className={mutedLink} href="/contact#faq">{t('footer.faq')}</Link></li>
          <li><Link className={mutedLink} href="/cart">{t('footer.cart')}</Link></li>
          <li><Link className={mutedLink} href="/privacy">{t('footer.privacy')}</Link></li>
          <li><Link className={mutedLink} href="/terms">{t('footer.terms')}</Link></li>
        </Column>
        <Column title={t('footer.contact')}>
          {channels.map((c) => <li key={c.id}><a className={mutedLink} href={c.url} target="_blank" rel="noreferrer">{t('footer.dm', { channel: c.label })}</a></li>)}
          {store.email && <li><a className={mutedLink} href={`mailto:${store.email}`}>{store.email}</a></li>}
          {store.phone && <li><a className={mutedLink} href={`tel:${store.phone}`}>{store.phone}</a></li>}
          {store.address && <li className={mutedLink}>{store.address}</li>}
        </Column>
        <Column title={t('footer.follow')}>
          <li><a className={mutedLink} href={instagramUrl(store)} target="_blank" rel="noreferrer">Instagram · @{store.instagramHandle}</a></li>
          {store.tiktokUrl && <li><a className={mutedLink} href={store.tiktokUrl} target="_blank" rel="noreferrer">TikTok</a></li>}
        </Column>
      </div>
      <div className="flex justify-center gap-4 border-t border-line py-8">
        <SocialLink href={instagramUrl(store)} name="Instagram"><InstagramLogo /></SocialLink>
        {store.tiktokUrl && <SocialLink href={store.tiktokUrl} name="TikTok"><TikTokLogo /></SocialLink>}
      </div>
      <div className="border-t border-line py-6 text-center text-xs text-muted">{t('footer.rights', { year: YEAR, name: site.name })}</div>
    </footer>
  )
}
