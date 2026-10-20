import { useI18n } from '../i18n'

interface Props {
  value: number
  max: number
  onChange: (n: number) => void
  label?: string
}

export function QuantitySelector({ value, max, onChange, label }: Props) {
  const { t } = useI18n()
  const btn = 'flex h-10 w-10 items-center justify-center text-lg text-muted transition-colors hover:text-fg disabled:opacity-30 disabled:hover:text-muted'
  return (
    <div role="group" aria-label={label ?? t('p.qty')} className="inline-flex items-center border border-line">
      <button type="button" className={btn} aria-label={t('p.qty.dec')} disabled={value <= 1} onClick={() => onChange(value - 1)}>−</button>
      <output aria-live="polite" className="w-10 text-center text-sm tabular-nums">{value}</output>
      <button type="button" className={btn} aria-label={t('p.qty.inc')} disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  )
}
