import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Button, ButtonLink } from '../components/Button'
import { Heading } from '../components/ui'
import { Drawer } from '../components/Drawer'
import { FilterPanel, categories, priceBuckets, type Filters } from '../components/FilterPanel'
import { FilterIcon } from '../components/icons'
import { ProductGrid } from '../components/ProductGrid'
import { collections, products } from '../data/products'
import { useCatalog } from '../context/CatalogContext'
import { useI18n, prodKey, type Key } from '../i18n'
import { isSoldOut } from '../lib/catalog'
import type { Product } from '../types'

type Sort = 'featured' | 'newest' | 'price-asc' | 'price-desc'
const sorts: { id: Sort; label: Key }[] = [
  { id: 'featured', label: 'sort.featured' }, { id: 'newest', label: 'sort.newest' },
  { id: 'price-asc', label: 'sort.priceAsc' }, { id: 'price-desc', label: 'sort.priceDesc' },
]

export default function Shop() {
  const { t } = useI18n()
  const { version } = useCatalog()
  const [params, setParams] = useSearchParams()
  const [drawer, setDrawer] = useState(false)

  const q = params.get('q') ?? ''
  const sort = (sorts.find((s) => s.id === params.get('sort'))?.id ?? 'featured') as Sort
  const filters: Filters = {
    category: categories.find((c) => c === params.get('category')) ?? '',
    collection: collections.find((c) => c.id === params.get('collection'))?.id ?? '',
    price: priceBuckets.find((b) => b.id === params.get('price'))?.id ?? '',
    inStock: params.get('stock') === '1',
  }

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    setParams(next, { replace: true })
  }
  const onFilter = (p: Partial<Filters>) =>
    update({
      ...('category' in p && { category: p.category || null }),
      ...('collection' in p && { collection: p.collection || null }),
      ...('price' in p && { price: p.price || null }),
      ...('inStock' in p && { stock: p.inStock ? '1' : null }),
    })
  const reset = () => setParams(q ? { q } : {}, { replace: true })

  const list = useMemo(() => {
    const bucket = priceBuckets.find((b) => b.id === filters.price)
    const needle = q.trim().toLowerCase()
    const out = products.filter((p) =>
      (!filters.category || p.category === filters.category) &&
      (!filters.collection || p.collectionId === filters.collection) &&
      (!bucket || bucket.test(p.price)) &&
      (!filters.inStock || !isSoldOut(p)) &&
      (!needle || `${p.name} ${p.category} ${t(prodKey(p.id))}`.toLowerCase().includes(needle)))
    const by: Record<Sort, (a: Product, b: Product) => number> = {
      featured: (a, b) => Number(!!b.bestSeller) - Number(!!a.bestSeller),
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
    }
    return [...out].sort(by[sort])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, sort, filters.category, filters.collection, filters.price, filters.inStock, t, version])

  return (
    <div className="container-x pt-14">
      <Heading as="h1" size="lg" eyebrow={t('shop.eyebrow')} title={q ? t('shop.results', { q }) : t('shop.all')} className="mb-10" reveal={false} />

      <div className="mb-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-y border-line py-3">
        <button className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] lg:hidden" onClick={() => setDrawer(true)}><FilterIcon /> {t('shop.filters')}</button>
        <p className="text-sm text-muted" aria-live="polite">{t('shop.count', { n: list.length })}</p>
        <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted">
          {t('shop.sort')}
          <select value={sort} onChange={(e) => update({ sort: e.target.value === 'featured' ? null : e.target.value })} className="field !w-auto py-2 normal-case tracking-normal">
            {sorts.map((s) => <option key={s.id} value={s.id}>{t(s.label)}</option>)}
          </select>
        </label>
      </div>

      <div className="grid gap-12 lg:grid-cols-[14rem_1fr]">
        <aside className="hidden lg:block" aria-label={t('shop.filters')}><FilterPanel filters={filters} onChange={onFilter} onReset={reset} /></aside>
        <div>
          {list.length ? <ProductGrid key={list.map((x) => x.id).join()} products={list} /> : (
            <div className="border border-line py-24 text-center">
              <p className="font-display text-3xl">{t('shop.empty.t')}</p>
              <p className="mt-2 text-sm text-muted">{t('shop.empty.d')}</p>
              <Button variant="outline" className="mt-6" onClick={reset}>{t('shop.clear')}</Button>
            </div>
          )}
        </div>
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title={t('shop.filters')} side="left"
        footer={<ButtonLink to="#" onClick={(e) => { e.preventDefault(); setDrawer(false) }} className="w-full">{t('shop.show', { n: list.length })}</ButtonLink>}>
        <FilterPanel filters={filters} onChange={onFilter} onReset={reset} />
      </Drawer>
    </div>
  )
}
