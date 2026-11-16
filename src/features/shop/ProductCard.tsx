'use client'
import Link from 'next/link'
import { Img } from '@/components/ui/Img'
import { catKey, useI18n } from '@/i18n'
import { isSoldOut } from '@/lib/catalog'
import { formatPrice } from '@/lib/format'
import type { Product } from '@/types'

/** Product tile: one garment on a soft violet-black panel, name and price underneath. The second photo (back) shows on hover. */
export function ProductCard({ product }: { product: Product }) {
  const { t } = useI18n()
  const sold = isSoldOut(product)
  const second = product.images[1]
  return (
    <Link href={`/product/${product.slug}`} className="group block" aria-label={`${product.name}, ${formatPrice(product.price)}`}>
      <div className="relative overflow-hidden rounded-2xl bg-card ring-1 ring-white/10 transition-[box-shadow] duration-500 group-hover:ring-violet-hi/70 group-hover:shadow-[0_24px_60px_-24px_rgb(109_63_224/0.8)] group-focus-visible:ring-violet-hi">
        <Img image={product.images[0]} ratio="aspect-[4/5]" className={`transition-transform duration-700 ease-out group-hover:scale-[1.03] ${sold ? 'opacity-50' : ''}`} sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw" />
        {second && (
          <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
            <Img image={second} ratio="aspect-[4/5]" sizes="(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw" />
          </div>
        )}
        {sold && <span className="absolute left-3 top-3 rounded-full bg-ink/90 px-3 py-1 text-xs font-medium">{t('badge.sold')}</span>}
        {!sold && product.bestSeller && <span className="absolute left-3 top-3 rounded-full bg-violet px-3 py-1 text-xs font-medium text-on-violet">{t('badge.best')}</span>}
      </div>
      <div className="mt-3.5 flex items-baseline justify-between gap-3 px-1">
        <h3 className="truncate text-[0.95rem] font-semibold">{product.name}</h3>
        <p className="shrink-0 text-[0.95rem] tabular-nums text-muted">{formatPrice(product.price)}<span className="sr-only"> · {t(catKey(product.category))}</span></p>
      </div>
    </Link>
  )
}
