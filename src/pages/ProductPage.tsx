import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, ButtonLink } from '../components/Button'
import { ProductGallery } from '../components/ProductGallery'
import { ProductGrid } from '../components/ProductGrid'
import { QuantitySelector } from '../components/QuantitySelector'
import { Reveal } from '../components/Reveal'
import { ContactActions } from '../components/ContactActions'
import { SizeSelector } from '../components/SizeSelector'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'
import { site } from '../data/site'
import { catKey, prodKey, useI18n, type Key } from '../i18n'
import { getProductBySlug, isSoldOut, related, stockFor, totalStock } from '../lib/catalog'
import { productInquiry } from '../lib/contact'
import { formatPrice } from '../lib/format'
import type { Size } from '../types'
import NotFound from './NotFound'

const careKeys: Key[] = ['care.1', 'care.2', 'care.3', 'care.4']

export default function ProductPage() {
  const { slug = '' } = useParams()
  const product = getProductBySlug(slug)
  if (!product) return <NotFound what="product" />
  // key resets selection state when navigating between products
  return <ProductView key={product.id} product={product} />
}

function ProductView({ product }: { product: NonNullable<ReturnType<typeof getProductBySlug>> }) {
  const { add, lines } = useCart()
  useCatalog() // re-render when live stock changes
  const { t } = useI18n()
  const [size, setSize] = useState<Size | null>(() => {
    const sizes = Object.keys(product.stock) as Size[]
    return sizes.length === 1 && stockFor(product, sizes[0]) > 0 ? sizes[0] : null
  })
  const [qty, setQty] = useState(1)
  const [sizeError, setSizeError] = useState(false)

  const sold = isSoldOut(product)
  const inCart = size ? lines.find((l) => l.item.productId === product.id && l.item.size === size)?.item.quantity ?? 0 : 0
  const remaining = size ? stockFor(product, size) - inCart : 0
  const total = totalStock(product)

  const submit = () => {
    if (!size) return setSizeError(true)
    if (remaining <= 0) return
    add(product, size, Math.min(qty, remaining))
    setQty(1)
  }

  return (
    <div className="container-x pt-10">
      <nav aria-label="Breadcrumb" className="mb-8 text-xs text-muted">
        <Link to="/shop" className="hover:text-fg">{t('p.breadcrumb')}</Link> / <span className="text-fg">{product.name}</span>
      </nav>
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
        <ProductGallery images={product.images} />
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow">{t(catKey(product.category))}</p>
          <h1 className="display mt-3 text-5xl md:text-6xl">{product.name}</h1>
          <p className="mt-4 text-xl tabular-nums">{formatPrice(product.price)}</p>
          <p className="mt-6 max-w-md leading-relaxed text-muted">{t(prodKey(product.id))}</p>

          <p className={`mt-6 text-sm ${sold ? 'text-danger' : total <= 5 ? 'text-gold' : 'text-muted'}`}>
            {sold ? t('p.sold') : total <= 5 ? t('p.low', { n: total }) : t('p.in')}
          </p>

          {!sold && (
            <div className="mt-8 space-y-7">
              <SizeSelector product={product} value={size} invalid={sizeError && !size} onChange={(s) => { setSize(s); setSizeError(false); setQty(1) }} />
              <div>
                <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted">{t('p.qty')}</p>
                <QuantitySelector value={qty} max={Math.max(1, remaining)} onChange={setQty} />
                {size && remaining <= 0 && <p className="mt-2 text-xs text-gold">{t('p.maxincart')}</p>}
              </div>
              <Button className="w-full sm:w-auto sm:min-w-64" onClick={submit} disabled={!!size && remaining <= 0}>{t('p.add')}</Button>
            </div>
          )}
          {sold && <ButtonLink to="/shop" variant="outline" className="mt-8">{t('p.browse')}</ButtonLink>}

          <ul className="mt-10 space-y-1 border-t border-line pt-6 text-sm text-muted">
            {careKeys.map((k) => <li key={k}>— {t(k)}</li>)}
          </ul>
          <div className="mt-6 border border-line bg-card p-4 text-sm text-muted">
            <p className="text-fg">{t('p.ask')}</p>
            <ContactActions className="mt-3" variant="outline" message={productInquiry(t, product.name, size)} />
          </div>
          <div className="mt-4 border border-line p-4 text-sm text-muted">
            <p className="text-fg">{t('p.delivery.t')}</p>
            <p className="mt-1">{t('p.delivery.d', { handle: site.instagramHandle })} <Link to="/info#delivery" className="text-gold underline-offset-4 hover:underline">{t('p.delivery.link')}</Link>.</p>
          </div>
        </div>
      </div>

      <section className="pt-28" aria-labelledby="rel-h">
        <Reveal><h2 id="rel-h" className="display mb-10 text-4xl md:text-5xl">{t('p.related')}</h2></Reveal>
        <ProductGrid products={related(product)} />
      </section>
    </div>
  )
}
