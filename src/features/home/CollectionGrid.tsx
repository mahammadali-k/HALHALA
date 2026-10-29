'use client'
import Link from 'next/link'
import { collections } from '@/data/products'
import { colKey, useI18n } from '@/i18n'
import { Img } from '@/components/ui/Img'
import { Reveal } from '@/components/ui/Reveal'
import { Heading } from '@/components/ui/Heading'

export function CollectionGrid() {
  const { t } = useI18n()
  return (
    <section className="container-x pt-28" aria-labelledby="collections-h">
      <Heading eyebrow={t('cols.eyebrow')} title={t('cols.title')} id="collections-h" />
      <ul className="mt-12 grid gap-5 md:grid-cols-3">
        {collections.map((c, i) => (
          <li key={c.id}>
            <Reveal delay={i * 0.1}>
              <Link href={`/shop?collection=${c.id}`} className="group relative block overflow-hidden">
                <div className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"><Img image={c.image} ratio="aspect-[3/4]" sizes="(min-width:768px) 33vw, 100vw" /></div>
                <div className="absolute inset-0 bg-gradient-to-t from-ink/90 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="font-display text-3xl">{t(colKey(c.id, 'title'))}</h3>
                  <p className="mt-1 text-sm text-muted">{t(colKey(c.id, 'blurb'))}</p>
                  <span className="mt-4 inline-block border-b border-accent pb-0.5 text-xs uppercase tracking-[0.2em] text-accent">{t('cols.explore')}</span>
                </div>
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  )
}
