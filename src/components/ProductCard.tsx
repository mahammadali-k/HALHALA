import { Link } from 'react-router-dom'
import { useCatalog } from '../context/CatalogContext'
import { catKey, useI18n } from '../i18n'
import { isSoldOut } from '../lib/catalog'
import { formatPrice } from '../lib/format'
import type { Product } from '../types'
import { BagIcon } from './icons'
import { Img } from './Img'

export function ProductCard({ product }: { product: Product }) {
  const { t } = useI18n()
  useCatalog() // re-render when live stock/price changes
  const sold = isSoldOut(product)
  const second = product.images[1] ?? product.images[0]
  return (
    <Link to={`/product/${product.slug}`} className="group block" aria-label={`${product.name}, ${formatPrice(product.price)}`}>
      <div className="chamfer-frame">
        <div className="chamfer-in relative overflow-hidden">
          <Img image={product.images[0]} ratio="aspect-[3/4]" className={`transition-opacity duration-500 ${sold ? 'opacity-50' : ''}`} sizes="(min-width:1024px) 25vw, 50vw" />
          {/* hover image swap */}
          <div className="absolute inset-0 opacity-0 transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:opacity-100 group-focus-visible:opacity-100">
            <Img image={second} ratio="aspect-[3/4]" sizes="(min-width:1024px) 25vw, 50vw" />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-violet/15 mix-blend-color" aria-hidden />
          {sold && <span className="tag absolute left-3 top-3 bg-ink/90 px-2 py-1">{t('badge.sold')}</span>}
          {!sold && product.bestSeller && <span className="tag absolute left-3 top-3 bg-violet px-2 py-1 text-fg">{t('badge.best')}</span>}
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3 px-1">
        <div>
          <h3 className="font-mono text-[0.72rem] font-medium uppercase tracking-[0.18em]">{product.name}</h3>
          <p className="mt-1.5 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-muted">{formatPrice(product.price)}<span className="sr-only"> · {t(catKey(product.category))}</span></p>
        </div>
        <span aria-hidden className="text-fg transition-colors group-hover:text-accent-deep"><BagIcon /></span>
      </div>
    </Link>
  )
}
