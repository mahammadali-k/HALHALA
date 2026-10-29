'use client'
import Link from 'next/link'
import { BagIcon } from '@/components/ui/icons'
import { Img } from '@/components/ui/Img'
import { catKey, useI18n } from '@/i18n'
import { isSoldOut } from '@/lib/catalog'
import { formatPrice } from '@/lib/format'
import type { Product } from '@/types'

/** Product tile: framed photo, then name / price / bag in a bar below (per the HALHALA mock-up). */
export function ProductCard({ product }: { product: Product }) {
  const { t } = useI18n()
  const sold = isSoldOut(product)
  const second = product.images[1] ?? product.images[0]
  return (
    <Link href={`/product/${product.slug}`} className="group block border border-line bg-ink-2/40 transition-colors hover:border-accent-deep focus-visible:border-accent-deep" aria-label={`${product.name}, ${formatPrice(product.price)}`}>
      <div className="relative overflow-hidden">
        <Img image={product.images[0]} ratio="aspect-[3/4]" className={`transition-opacity duration-500 ${sold ? 'opacity-50' : ''}`} sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw" />
        {/* hover image swap */}
        <div className="absolute inset-0 opacity-0 transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:opacity-100 group-focus-visible:opacity-100">
          <Img image={second} ratio="aspect-[3/4]" sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-violet/15 mix-blend-color" aria-hidden />
        {sold && <span className="tag absolute left-2 top-2 bg-ink/90 px-2 py-1">{t('badge.sold')}</span>}
        {!sold && product.bestSeller && <span className="tag absolute left-2 top-2 bg-violet px-2 py-1 text-on-violet">{t('badge.best')}</span>}
      </div>
      <div className="flex items-end justify-between gap-2 border-t border-line px-3 py-3 sm:px-4">
        <div className="min-w-0">
          <h3 className="truncate font-mono text-[0.68rem] font-medium uppercase tracking-[0.16em] sm:text-[0.72rem]">{product.name}</h3>
          <p className="mt-1.5 font-mono text-[0.68rem] uppercase tracking-[0.12em] text-muted sm:text-[0.72rem]">{formatPrice(product.price)}<span className="sr-only"> · {t(catKey(product.category))}</span></p>
        </div>
        <span aria-hidden className="shrink-0 text-fg transition-colors group-hover:text-accent-deep"><BagIcon /></span>
      </div>
    </Link>
  )
}
