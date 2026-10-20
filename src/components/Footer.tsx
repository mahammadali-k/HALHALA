import { Link } from 'react-router-dom'
import { nav } from '../data/nav'
import { site } from '../data/site'
import { useI18n } from '../i18n'
import { dmChannels } from '../lib/contact'
import { Ornament } from './Ornament'
import { mutedLink } from './ui'
import { Wordmark } from './Wordmark'

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-[0.7rem] uppercase tracking-[0.25em] text-gold">{title}</h2>
      <ul className="space-y-2">{children}</ul>
    </div>
  )
}

export function Footer() {
  const { t } = useI18n()
  const shop = nav.find((n) => n.label === 'nav.shop')?.children ?? []
  return (
    <footer className="mt-32 border-t border-line bg-ink-2">
      <Ornament className="-translate-y-1/2" />
      <div className="container-x grid gap-12 pb-16 pt-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-1">
          <Wordmark />
          <p className="mt-4 font-display text-xl italic text-muted">{site.tagline}</p>
        </div>
        <Column title={t('footer.shop')}>{shop.map((l) => <li key={l.to}><Link className={mutedLink} to={l.to}>{t(l.label)}</Link></li>)}</Column>
        <Column title={t('footer.help')}>
          <li><Link className={mutedLink} to="/info#delivery">{t('footer.delivery')}</Link></li>
          <li><Link className={mutedLink} to="/info#returns">{t('footer.returns')}</Link></li>
          <li><Link className={mutedLink} to="/contact#faq">{t('footer.faq')}</Link></li>
          <li><Link className={mutedLink} to="/cart">{t('footer.cart')}</Link></li>
        </Column>
        <Column title={t('footer.contact')}>
          {dmChannels.map((c) => <li key={c.id}><a className={mutedLink} href={c.url} target="_blank" rel="noreferrer">{t('footer.dm', { channel: c.label })}</a></li>)}
          {site.email && <li><a className={mutedLink} href={`mailto:${site.email}`}>{site.email}</a></li>}
          {site.phone && <li><a className={mutedLink} href={`tel:${site.phone}`}>{site.phone}</a></li>}
          {site.address && <li className={mutedLink}>{site.address}</li>}
        </Column>
        <Column title={t('footer.follow')}>
          <li><a className={mutedLink} href={site.instagramUrl} target="_blank" rel="noreferrer">Instagram · @{site.instagramHandle}</a></li>
          {site.tiktokUrl && <li><a className={mutedLink} href={site.tiktokUrl} target="_blank" rel="noreferrer">TikTok</a></li>}
        </Column>
      </div>
      <div className="border-t border-line py-6 text-center text-xs text-muted">{t('footer.rights', { year: new Date().getFullYear(), name: site.name })}</div>
    </footer>
  )
}
