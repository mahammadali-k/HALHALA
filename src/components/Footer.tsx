import { Link } from 'react-router-dom'
import { nav } from '../data/nav'
import { site } from '../data/site'
import { useI18n } from '../i18n'
import { dmChannels } from '../lib/contact'
import { mutedLink } from './ui'
import { Wordmark } from './Wordmark'

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 font-mono text-[0.68rem] uppercase tracking-[0.25em] text-accent">{title}</h2>
      <ul className="space-y-2">{children}</ul>
    </div>
  )
}

const svg = (d: string) => (
  <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
)
// cotton boll · truck · shield · hanger
const ICONS = {
  cotton: 'M16 27V15M10 15a5 5 0 1 1 4-8 5 5 0 0 1 8 0 5 5 0 1 1 4 8c0 3-4 3-4 3s-2 2-6 2-6-2-6-2-4 0-4-3Z',
  truck: 'M3 8h15v13H3zM18 12h6l4 4v5h-10zM8 24a2 2 0 1 0 0-.01M23 24a2 2 0 1 0 0-.01',
  shield: 'M16 3 6 7v8c0 6 4 11 10 14 6-3 10-8 10-14V7L16 3Zm-4 12 3 3 6-6',
  hanger: 'M16 11a3 3 0 1 0-3-3M16 11v3L4 22h24L16 14',
}

/** Configurable perks row. These claims come from the HALHALA design brief — confirm them before launch. */
function Perks() {
  const { t } = useI18n()
  const items = [
    { icon: ICONS.cotton, title: t('perk.cotton') },
    { icon: ICONS.truck, title: t('perk.delivery'), sub: t('perk.delivery.sub') },
    { icon: ICONS.shield, title: t('perk.pay') },
    { icon: ICONS.hanger, title: t('perk.sizes') },
  ]
  return (
    <ul className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
      {items.map((i) => (
        <li key={i.title} className="flex flex-col items-center gap-2 bg-ink-2 px-4 py-6 text-center text-accent">
          {svg(i.icon)}
          <span className="font-mono text-[0.62rem] font-medium uppercase leading-4 tracking-[0.18em]">{i.title}{i.sub && <><br /><span className="text-muted">{i.sub}</span></>}</span>
        </li>
      ))}
    </ul>
  )
}

export function Footer() {
  const { t } = useI18n()
  const shop = nav.find((n) => n.label === 'nav.shop')?.children ?? []
  return (
    <footer className="mt-28 border-t border-line">
      <div className="container-x pt-12"><Perks /></div>
      <div className="container-x grid gap-12 pb-16 pt-14 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <Wordmark className="!text-4xl" />
          <p className="mt-4 font-mono text-[0.7rem] uppercase leading-5 tracking-[0.2em] text-muted">{t('footer.slogan')}</p>
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
      <div className="border-t border-line py-6 text-center font-mono text-[0.65rem] uppercase tracking-[0.2em] text-muted">{t('footer.rights', { year: new Date().getFullYear(), name: site.name })}</div>
    </footer>
  )
}
