'use client'
import { useCatalog } from '@/context/CatalogContext'
import { catKey, useI18n, type Key } from '@/i18n'
import { activeCategories } from '@/lib/catalog'
import type { Category } from '@/types'

export interface Filters {
  category: Category | ''
  price: '' | 'under-50' | '50-100' | 'over-100'
  inStock: boolean
}

export const priceBuckets: { id: Filters['price']; label: Key; test: (n: number) => boolean }[] = [
  { id: 'under-50', label: 'f.under50', test: (n) => n < 50 },
  { id: '50-100', label: 'f.50100', test: (n) => n >= 50 && n <= 100 },
  { id: 'over-100', label: 'f.over100', test: (n) => n > 100 },
]

interface Props { filters: Filters; onChange: (patch: Partial<Filters>) => void; onReset: () => void }

function Group({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-line pb-6">
      <legend className="mb-3 text-[0.7rem] uppercase tracking-[0.25em] text-accent">{legend}</legend>
      <div className="space-y-2">{children}</div>
    </fieldset>
  )
}
function Radio({ name, checked, label, onSelect }: { name: string; checked: boolean; label: string; onSelect: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-muted has-[:checked]:text-fg hover:text-fg">
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="peer sr-only" />
      <span className="h-3.5 w-3.5 border border-line peer-checked:border-accent peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-accent" aria-hidden />
      {label}
    </label>
  )
}

export function FilterPanel({ filters, onChange, onReset }: Props) {
  const { t } = useI18n()
  const categories = activeCategories(useCatalog().products)
  return (
    <div className="space-y-6">
      {categories.length > 1 && (
        <Group legend={t('f.category')}>
          <Radio name="cat" checked={filters.category === ''} label={t('f.all')} onSelect={() => onChange({ category: '' })} />
          {categories.map((c) => <Radio key={c} name="cat" checked={filters.category === c} label={t(catKey(c))} onSelect={() => onChange({ category: c })} />)}
        </Group>
      )}
      <Group legend={t('f.price')}>
        <Radio name="price" checked={filters.price === ''} label={t('f.any')} onSelect={() => onChange({ price: '' })} />
        {priceBuckets.map((b) => <Radio key={b.id} name="price" checked={filters.price === b.id} label={t(b.label)} onSelect={() => onChange({ price: b.id })} />)}
      </Group>
      <label className="flex cursor-pointer items-center gap-3 text-sm text-muted hover:text-fg">
        <input type="checkbox" checked={filters.inStock} onChange={(e) => onChange({ inStock: e.target.checked })} className="accent-[#B69A68]" />
        {t('f.instock')}
      </label>
      <button onClick={onReset} className="text-xs uppercase tracking-widest text-muted underline-offset-4 hover:text-fg hover:underline">{t('f.reset')}</button>
    </div>
  )
}
