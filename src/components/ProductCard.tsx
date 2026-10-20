import { Link } from 'react-router-dom'
import { useCatalog } from '../context/CatalogContext'
import { catKey, useI18n } from '../i18n'
import { isSoldOut } from '../lib/catalog'
import { formatPrice } from '../lib/format'
import type { Product } from '../types'
import { Img } from './Img'

export function ProductCard({ product }: { product: Product }) {
  const { t } = useI18n()
  useCatalog() // re-render when live stock changes
  const sold = isSoldOut(product)
  const second = product.images[1] ?? product.images[0]
  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="relative overflow-hidden">
        <Img image={product.images[0]} className={`transition-opacity duration-500 ${sold ? 'opacity-50' : ''}`} sizes="(min-width:1024px) 25vw, 50vw" />
        {/* hover image swap */}
        <div className="absolute inset-0 opacity-0 transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:opacity-100 group-focus-visible:opacity-100">
          <Img image={second} />
        </div>
        {sold && <span className="absolute left-3 top-3 bg-ink/90 px-2 py-1 text-[0.6rem] uppercase tracking-[0.2em] text-muted">{t('badge.sold')}</span>}
        {!sold && product.bestSeller && <span className="absolute left-3 top-3 bg-burgundy px-2 py-1 text-[0.6rem] uppercase tracking-[0.2em]">{t('badge.best')}</span>}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm">{product.name}</h3>
          <p className="mt-0.5 text-xs text-muted">{t(catKey(product.category))}</p>
        </div>
        <p className="text-sm tabular-nums">{formatPrice(product.price)}</p>
      </div>
    </Link>
  )
}
