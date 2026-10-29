'use client'
import { useState, type FormEvent } from 'react'
import { ContactActions } from '@/components/ContactActions'
import { Faq } from '@/components/Faq'
import { Field } from '@/components/ui/Field'
import { Heading } from '@/components/ui/Heading'
import { accentLink } from '@/components/ui/styles'
import { site } from '@/data/site'
import { useI18n } from '@/i18n'
import { dmChannels } from '@/lib/contact'

export function ContactView() {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)
  const ready = body.trim().length >= 5
  const message = `${t('ct.hello')}\n${body.trim()}${name.trim() ? `\n— ${name.trim()}` : ''}`
  const row = 'flex justify-between gap-6 border-b border-line py-4 text-sm'
  const submit = (e: FormEvent) => { e.preventDefault(); setSent(true) }

  return (
    <div className="container-x pt-14">
      <Heading as="h1" size="lg" eyebrow={t('ct.eyebrow')} title={t('ct.title')} reveal={false} />
      <p className="mt-6 max-w-xl text-muted">{t('ct.lead', { channels: dmChannels.map((c) => c.label).join(' / ') })}</p>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <form onSubmit={submit} className="space-y-5" aria-label={t('ct.message')}>
          <Field id="c-name" label={t('ct.name')} optional={t('co.optional')}><input id="c-name" value={name} onChange={(e) => { setName(e.target.value); setSent(false) }} autoComplete="name" className="field" /></Field>
          <Field id="c-body" label={t('ct.message')} error={sent && !ready ? t('ct.err') : undefined}><textarea id="c-body" value={body} onChange={(e) => { setBody(e.target.value); setSent(false) }} rows={5} placeholder={t('ct.placeholder')} className="field" aria-invalid={sent && !ready} /></Field>
          {ready
            ? <><p className="text-xs uppercase tracking-widest text-muted">{t('ct.sendwith')}</p><ContactActions message={message} /></>
            : <button type="submit" className="text-xs uppercase tracking-widest text-accent">{t('ct.choose')}</button>}
        </form>

        <div>
          <dl className="border-t border-line">
            {dmChannels.map((c) => <div key={c.id} className={row}><dt className="text-muted">{t('ct.profile', { channel: c.label })}</dt><dd><a className={accentLink} href={c.id === 'instagram' ? site.instagramUrl : c.url} target="_blank" rel="noreferrer">{c.id === 'instagram' ? `@${site.instagramHandle}` : t('ct.open')}</a></dd></div>)}
            {site.email && <div className={row}><dt className="text-muted">{t('ct.email')}</dt><dd><a href={`mailto:${site.email}`}>{site.email}</a></dd></div>}
            {site.phone && <div className={row}><dt className="text-muted">{t('ct.phone')}</dt><dd><a href={`tel:${site.phone}`}>{site.phone}</a></dd></div>}
            {site.address && <div className={row}><dt className="text-muted">{t('ct.address')}</dt><dd>{site.address}</dd></div>}
          </dl>
        </div>
      </div>

      <section id="faq" className="mt-24 scroll-mt-24" aria-labelledby="faq-title">
        <Heading id="faq-title" eyebrow={t('ct.faq.eyebrow')} title={t('ct.faq.title')} className="mb-8" />
        <Faq />
      </section>
    </div>
  )
}
