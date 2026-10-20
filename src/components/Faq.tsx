import { useCatalog } from '../context/CatalogContext'
import { site } from '../data/site'
import { useI18n, type Key } from '../i18n'

const items = [1, 2, 3, 4, 5] as const

export function Faq() {
  const { t } = useI18n()
  const { backend, config } = useCatalog()
  const online = backend === 'on'
  const answer = (n: number) =>
    n === 4 && site.deliveryPolicy ? site.deliveryPolicy
    : n === 1 && online ? t('faq.1.a.online')
    : n === 2 && online ? t(config?.payments.includes('card') ? 'faq.2.a.card' : 'faq.2.a.cod')
    : t(`faq.${n}.a` as Key)
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((n) => (
        <details key={n} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-base marker:hidden [&::-webkit-details-marker]:hidden">
            {t(`faq.${n}.q` as Key)}
            <span aria-hidden className="text-gold transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{answer(n)}</p>
        </details>
      ))}
    </div>
  )
}
