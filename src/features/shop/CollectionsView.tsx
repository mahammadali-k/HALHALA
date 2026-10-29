'use client'
import { ButtonLink } from '@/components/ui/Button'
import { ProductGrid } from '@/features/shop/ProductGrid'
import { Heading } from '@/components/ui/Heading'
import { collections, products } from '@/data/products'
import { colKey, useI18n } from '@/i18n'

export function CollectionsView() {
  const { t } = useI18n()
  return (
    <div className="container-x pt-14">
      <Heading as="h1" size="lg" eyebrow={t('cp.eyebrow')} title={t('cp.title')} reveal={false} />
      {collections.map((c) => {
        const items = products.filter((p) => p.collectionId === c.id)
        return (
          <section key={c.id} className="mt-20" aria-labelledby={`c-${c.id}`}>
            <Heading title={t(colKey(c.id, 'title'))} id={`c-${c.id}`} eyebrow={t(colKey(c.id, 'blurb'))} className="mb-8"
              action={<ButtonLink href={`/shop?collection=${c.id}`} variant="outline">{t('cp.viewshop')}</ButtonLink>} />
            <ProductGrid products={items} />
          </section>
        )
      })}
    </div>
  )
}
