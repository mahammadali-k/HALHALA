import { Link } from 'react-router-dom'
import { ButtonLink } from '../components/Button'
import { CartLineItem } from '../components/CartLineItem'
import { Heading, underlineBtn } from '../components/ui'
import { useCart } from '../context/CartContext'
import { useI18n } from '../i18n'
import { formatPrice } from '../lib/format'

export default function CartPage() {
  const { lines, total, count, clear } = useCart()
  const { t } = useI18n()
  return (
    <div className="container-x pt-14">
      <Heading as="h1" size="lg" title={t('cart.title')} reveal={false} />
      {lines.length === 0 ? (
        <div className="mt-12 border border-line py-24 text-center">
          <p className="font-display text-3xl">{t('cart.empty')}</p>
          <ButtonLink to="/shop" variant="outline" className="mt-6">{t('cart.continue')}</ButtonLink>
        </div>
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem]">
          <ul className="border-t border-line">{lines.map((l) => <CartLineItem key={l.key} line={l} />)}</ul>
          <aside className="h-fit border border-line bg-card p-6" aria-label={t('co.summary')}>
            <h2 className="text-xs uppercase tracking-[0.25em] text-accent">{t('cart.summary')}</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted">{t('cart.items', { n: count })}</dt><dd className="tabular-nums">{formatPrice(total)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">{t('cart.delivery')}</dt><dd className="text-muted">{t('cart.delivery.v')}</dd></div>
              <div className="flex justify-between border-t border-line pt-3 text-base"><dt>{t('cart.total')}</dt><dd className="tabular-nums">{formatPrice(total)}</dd></div>
            </dl>
            <ButtonLink to="/checkout" className="mt-6 w-full">{t('cart.checkout')}</ButtonLink>
            <div className="mt-4 flex justify-between text-xs text-muted">
              <Link to="/shop" className={underlineBtn}>{t('cart.continue')}</Link>
              <button onClick={clear} className={underlineBtn}>{t('cart.clear')}</button>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
