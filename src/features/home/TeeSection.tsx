'use client'
import Link from 'next/link'
import { Heading } from '@/components/ui/Heading'
import { accentLink } from '@/components/ui/styles'
import { useCatalog } from '@/context/CatalogContext'
import { useI18n } from '@/i18n'
import { ProductGrid } from '@/features/shop/ProductGrid'

/** "[ OUR COLLECTION ] T-SHIRTS" grid from the design. */
export function TeeSection() {
  const { t } = useI18n()
  const { products } = useCatalog()
  return (
    <section className="container-x pt-12 sm:pt-16" aria-labelledby="tees-h">
      <Heading eyebrow={`[ ${t('sec.our')} ]`} title={t('cat.T-Shirts')} id="tees-h" className="mb-8 sm:mb-10"
        action={<Link href="/shop" className={accentLink}>{t('common.viewAll')} →</Link>} />
      <ProductGrid products={products} />
    </section>
  )
}
