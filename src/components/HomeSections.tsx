import { Link } from 'react-router-dom'
import { useCatalog } from '../context/CatalogContext'
import { site } from '../data/site'
import { useI18n, type Key } from '../i18n'
import { openChat } from '../lib/contact'
import { Button } from './Button'
import { ContactActions } from './ContactActions'
import { Faq } from './Faq'
import { Reveal } from './Reveal'
import { Heading } from './ui'

const cell = 'group flex flex-col gap-1 bg-ink-2 p-6 transition-colors hover:bg-card'

/** Four quick entry points directly under the hero. */
export function FeatureStrip() {
  const { t } = useI18n()
  const body = (k: 'dm' | 'chat' | 'stock' | 'delivery') => (
    <>
      <span className="eyebrow">{t(`feat.${k}.t` as Key)}</span>
      <span className="text-sm text-muted">{t(`feat.${k}.d` as Key, { handle: site.instagramHandle })}</span>
    </>
  )
  return (
    <section aria-label={t('feat.label')} className="container-x pt-6">
      <ul className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
        <li><a href={site.dmUrl} target="_blank" rel="noreferrer" className={cell}>{body('dm')}</a></li>
        <li><button onClick={openChat} className={`${cell} w-full text-left`}>{body('chat')}</button></li>
        <li><Link to="/shop?stock=1" className={cell}>{body('stock')}</Link></li>
        <li><Link to="/info" className={cell}>{body('delivery')}</Link></li>
      </ul>
    </section>
  )
}

const steps = ['1', '2', '3'] as const

export function HowItWorks() {
  const { t } = useI18n()
  const { backend } = useCatalog()
  return (
    <section className="container-x pt-28" aria-labelledby="how-h">
      <Heading eyebrow={t('how.eyebrow')} title={t('how.title')} id="how-h" />
      <ol className="mt-10 grid gap-px border border-line bg-line md:grid-cols-3">
        {steps.map((n, i) => (
          <li key={n} className="bg-ink-2 p-8">
            <Reveal delay={i * 0.08}>
              <span className="font-display text-5xl text-gold">0{n}</span>
              <h3 className="mt-3 text-sm uppercase tracking-[0.2em]">{t(`how.${n}.t` as Key)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t(n === '3' && backend === 'on' ? 'how.3.d.online' : (`how.${n}.d` as Key))}</p>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** FAQ + direct contact in one band. */
export function QuestionsBand() {
  const { t } = useI18n()
  return (
    <section className="container-x grid gap-12 pt-28 lg:grid-cols-[1fr_1.1fr]" aria-labelledby="faq-h">
      <div>
        <Heading eyebrow={t('q.eyebrow')} title={t('q.title')} id="faq-h" />
        <p className="mt-6 max-w-sm text-muted">{t('q.body')}</p>
        <ContactActions className="mt-8" message={t('msg.general')} />
        <Button variant="outline" className="mt-4" onClick={openChat}>{t('q.ask')}</Button>
      </div>
      <Reveal><Faq /></Reveal>
    </section>
  )
}
