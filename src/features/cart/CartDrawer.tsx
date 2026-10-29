'use client'
import { useCart } from '@/context/CartContext'
import { useI18n } from '@/i18n'
import { formatPrice } from '@/lib/format'
import { ButtonLink } from '@/components/ui/Button'
import { CartLineItem } from '@/features/cart/CartLineItem'
import { Drawer } from '@/components/ui/Drawer'

export function CartDrawer() {
  const { isOpen, close, lines, total } = useCart()
  const { t } = useI18n()
  return (
    <Drawer
      open={isOpen} onClose={close} title={t('cart.drawer')}
      footer={lines.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between text-sm"><span className="text-muted">{t('cart.subtotal')}</span><span className="tabular-nums">{formatPrice(total)}</span></div>
          <p className="text-xs text-muted">{t('cart.deliveryNote')}</p>
          <ButtonLink href="/checkout" onClick={close} className="w-full">{t('cart.checkout')}</ButtonLink>
          <ButtonLink href="/cart" variant="outline" onClick={close} className="w-full">{t('cart.view')}</ButtonLink>
        </div>
      )}
    >
      {lines.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-display text-3xl">{t('cart.empty')}</p>
          <ButtonLink href="/shop" variant="outline" onClick={close} className="mt-6">{t('cart.continue')}</ButtonLink>
        </div>
      ) : (
        <ul>{lines.map((l) => <CartLineItem key={l.key} line={l} onNavigate={close} />)}</ul>
      )}
    </Drawer>
  )
}
