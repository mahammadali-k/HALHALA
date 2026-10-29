'use client'
import Link from 'next/link'
import { Heading } from '@/components/ui/Heading'
import { Img } from '@/components/ui/Img'
import { Reveal } from '@/components/ui/Reveal'
import { useCatalog } from '@/context/CatalogContext'
import { catKey, useI18n } from '@/i18n'
import { activeCategories } from '@/lib/catalog'

/** One big card per product category, pictured with its newest product. */
export function CategoryGrid() {
  const { t } = useI18n()
  const { products } = useCatalog()
  const cats = activeCategories(products)
  if (cats.length < 2) return null
  return (
    <section className="container-x pt-24 sm:pt-28" aria-labelledby="categories-h">
      <Heading eyebrow={t('cols.eyebrow')} title={t('cols.title')} id="categories-h" />
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5">
        {cats.map((c, i) => {
          const items = products.filter((p) => p.category === c)
          return (
            <li key={c}>
              <Reveal delay={i * 0.1}>
                <Link href={`/shop?category=${c}`} className="group relative block overflow-hidden border border-line transition-colors hover:border-accent-deep">
                  <div className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"><Img image={items[0].images[0]} ratio="aspect-[4/3] sm:aspect-[5/4]" sizes="(min-width:640px) 50vw, 100vw" /></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                    <h3 className="display text-3xl">{t(catKey(c))}</h3>
                    <p className="mt-1 text-sm text-muted">{t('shop.count', { n: items.length })}</p>
                    <span className="mt-3 inline-block border-b border-accent pb-0.5 font-mono text-xs uppercase tracking-[0.2em] text-accent">{t('cols.explore')}</span>
                  </div>
                </Link>
              </Reveal>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
