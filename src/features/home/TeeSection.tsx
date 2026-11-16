'use client'
import Link from 'next/link'
import { Heading } from '@/components/ui/Heading'
import { accentLink } from '@/components/ui/styles'
import { useCatalog } from '@/context/CatalogContext'
import { catKey, useI18n } from '@/i18n'
import { activeCategories } from '@/lib/catalog'
import { ProductGrid } from '@/features/shop/ProductGrid'

/**
 * Products, one section per category (T-shirts, Hoodies, …). Every card is a single garment on a mannequin with its price;
 * click → the product page opens the enlarged view (360°, gallery, sizes, add to cart).
 */
export function TeeSection() {
  const { t } = useI18n()
  const { products } = useCatalog()
  return (
    <>
      {activeCategories(products).map((c, i) => (
        <section key={c} id={`cat-${c.toLowerCase()}`} className={`container-x scroll-mt-20 ${i === 0 ? 'pt-16 sm:pt-24' : 'pt-24 sm:pt-32'}`} aria-labelledby={`cat-h-${c}`}>
          <Heading title={t(catKey(c))} id={`cat-h-${c}`} className="mb-8 sm:mb-12"
            action={<Link href={`/shop?category=${c}`} className={accentLink}>{t('common.viewAll')}</Link>} />
          <ProductGrid products={products.filter((p) => p.category === c)} />
        </section>
      ))}
    </>
  )
}
