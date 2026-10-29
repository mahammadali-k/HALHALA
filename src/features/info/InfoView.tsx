'use client'
import Link from 'next/link'
import { ContactActions } from '@/components/ContactActions'
import { Heading } from '@/components/ui/Heading'
import { accentLink } from '@/components/ui/styles'
import { useCatalog } from '@/context/CatalogContext'
import { policyText } from '@/lib/store'
import { useI18n } from '@/i18n'

export function Policy({ id, title, text, topic }: { id: string; title: string; text: string; topic: string }) {
  const { t } = useI18n()
  return (
    <section id={id} className="mt-12 scroll-mt-24">
      <h2 className="font-display text-3xl text-accent">{title}</h2>
      {text ? <p className="mt-4 text-muted">{text}</p> : (
        <div className="mt-4 border border-line bg-card p-5 text-sm text-muted">
          <p>{t('info.missing', { title })}</p>
          <ContactActions className="mt-4" message={t('info.ask', { topic })} />
        </div>
      )}
    </section>
  )
}

export function InfoView() {
  const { t, lang } = useI18n()
  const { store } = useCatalog()
  return (
    <div className="container-x max-w-3xl pt-14">
      <Heading as="h1" size="lg" title={t('info.title')} reveal={false} />
      <Policy id="delivery" title={t('info.delivery')} text={policyText(store, 'delivery', lang)} topic={t('info.topic.delivery')} />
      <Policy id="returns" title={t('info.returns')} text={policyText(store, 'returns', lang)} topic={t('info.topic.returns')} />
      <p className="mt-12 text-sm text-muted">{t('info.more')} <Link href="/contact#faq" className={accentLink}>{t('info.faq')}</Link></p>
    </div>
  )
}
