'use client'
import { useCatalog } from '@/context/CatalogContext'
import { policyText } from '@/lib/store'
import { useI18n, type Key } from '@/i18n'

const items = [1, 2, 3, 4, 5] as const

export function Faq() {
  const { t, lang } = useI18n()
  const { config, store } = useCatalog()
  const answer = (n: number) =>
    n === 4 && policyText(store, 'delivery', lang) ? policyText(store, 'delivery', lang)
    : n === 1 ? t('faq.1.a.online')
    : n === 2 ? t(config.payments.includes('card') ? 'faq.2.a.card' : 'faq.2.a.cod')
    : t(`faq.${n}.a` as Key)
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((n) => (
        <details key={n} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base marker:hidden [&::-webkit-details-marker]:hidden">
            {t(`faq.${n}.q` as Key)}
            <span aria-hidden className="text-accent transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{answer(n)}</p>
        </details>
      ))}
    </div>
  )
}
