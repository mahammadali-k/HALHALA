import type { ReactNode } from 'react'
import { useI18n, type Key } from '../i18n'
import type { Order } from '../lib/api'
import { formatPrice } from '../lib/format'

const badge: Record<Order['status'], string> = {
  new: 'border-gold/60 text-gold', confirmed: 'border-burgundy-hi text-fg', shipped: 'border-muted text-fg',
  delivered: 'border-emerald-500/60 text-emerald-300', cancelled: 'border-line text-muted line-through',
}

export const orderDate = (iso: string, lang: string) => new Date(`${iso.replace(' ', 'T')}Z`).toLocaleDateString(lang, { year: 'numeric', month: 'short', day: 'numeric' })

/** Order summary used by the account page, the admin panel and the confirmation page. */
export function OrderCard({ order, children, showContact }: { order: Order; children?: ReactNode; showContact?: boolean }) {
  const { t, lang } = useI18n()
  return (
    <article className="border border-line bg-card p-5" aria-label={t('ord.number', { n: order.number })}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl">{t('ord.number', { n: order.number })}</h3>
          <p className="text-xs text-muted">{t('ord.placed', { date: orderDate(order.createdAt, lang) })}</p>
        </div>
        <span className={`border px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.2em] ${badge[order.status]}`}>{t(`st.${order.status}` as Key)}</span>
      </header>
      <ul className="mt-4 divide-y divide-line text-sm">
        {order.items.map((i) => (
          <li key={`${i.productId}-${i.size}`} className="flex justify-between gap-3 py-2">
            <span>{i.name} <span className="text-muted">· {i.size} × {i.quantity}</span></span>
            <span className="tabular-nums">{formatPrice(i.unitPrice * i.quantity)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
        {order.deliveryFee > 0 && <div className="flex justify-between"><dt className="text-muted">{t('co.fee')}</dt><dd className="tabular-nums">{formatPrice(order.deliveryFee)}</dd></div>}
        <div className="flex justify-between text-base"><dt>{t('co.total')}</dt><dd className="tabular-nums">{formatPrice(order.total)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">{t('ord.payment')}</dt><dd>{t(`pm.${order.paymentMethod}` as Key)} · {t(`ps.${order.paymentStatus}` as Key)}</dd></div>
      </dl>
      {showContact && (
        <p className="mt-3 border-t border-line pt-3 text-sm text-muted">
          <span className="text-fg">{order.name}</span> · {order.phone}{order.email && ` · ${order.email}`}<br />
          {order.city}, {order.address}{order.notes && <><br />“{order.notes}”</>}
        </p>
      )}
      {children && <div className="mt-4 flex flex-wrap items-center gap-3">{children}</div>}
    </article>
  )
}
