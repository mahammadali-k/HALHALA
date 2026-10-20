import { useCatalog } from '../context/CatalogContext'
import { useI18n } from '../i18n'
import { stockFor } from '../lib/catalog'
import type { Product, Size } from '../types'

interface Props {
  product: Product
  value: Size | null
  onChange: (s: Size) => void
  invalid?: boolean
}

export function SizeSelector({ product, value, onChange, invalid }: Props) {
  const { t } = useI18n()
  useCatalog() // re-render when live stock changes
  const sizes = Object.keys(product.stock) as Size[]
  return (
    <fieldset>
      <legend className="mb-3 flex w-full justify-between text-xs uppercase tracking-[0.2em] text-muted">
        <span>{t('p.size')}</span>
        {invalid && <span role="alert" className="text-danger normal-case tracking-normal">{t('p.size.select')}</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {sizes.map((s) => {
          const out = stockFor(product, s) === 0
          const selected = value === s
          return (
            <label key={s} className={`relative ${out ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="radio" name="size" value={s} disabled={out} checked={selected}
                onChange={() => onChange(s)} className="peer sr-only"
              />
              <span
                className={`flex h-11 min-w-12 items-center justify-center border px-3 text-sm transition-colors
                  peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold
                  ${out ? 'border-line/60 text-muted/40 line-through' : selected ? 'border-gold bg-gold text-ink' : 'border-line hover:border-gold-deep'}`}
              >
                {s}
              </span>
              {out && <span className="sr-only">{t('p.size.unavailable')}</span>}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
