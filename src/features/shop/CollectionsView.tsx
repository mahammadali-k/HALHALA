'use client'
import { ButtonLink } from '@/components/ui/Button'
import { Heading } from '@/components/ui/Heading'
import { useCatalog } from '@/context/CatalogContext'
import { ProductGrid } from '@/features/shop/ProductGrid'
import { catKey, useI18n } from '@/i18n'
import { activeCategories } from '@/lib/catalog'

/** The whole collection, one section per category. */
export function CollectionsView() {
  const { t } = useI18n()
  const { products } = useCatalog()
  return (
    <div className="container-x pt-10 sm:pt-14">
      <Heading as="h1" size="lg" eyebrow={t('cp.eyebrow')} title={t('cp.title')} reveal={false} />
      {activeCategories(products).map((c) => (
        <section key={c} className="mt-16 sm:mt-20" aria-labelledby={`c-${c}`}>
          <Heading title={t(catKey(c))} id={`c-${c}`} className="mb-8"
            action={<ButtonLink href={`/shop?category=${c}`} variant="outline">{t('cp.viewshop')}</ButtonLink>} />
          <ProductGrid products={products.filter((p) => p.category === c)} />
        </section>
      ))}
    </div>
  )
}
