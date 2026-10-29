'use client'
import Link from 'next/link'
import type { CartLine } from '@/context/CartContext'
import { useCart } from '@/context/CartContext'
import { useI18n } from '@/i18n'
import { formatPrice } from '@/lib/format'
import { Img } from '@/components/ui/Img'
import { QuantitySelector } from '@/components/ui/QuantitySelector'

export function CartLineItem({ line, onNavigate }: { line: CartLine; onNavigate?: () => void }) {
  const { setQuantity, remove } = useCart()
  const { t } = useI18n()
  const { product, item } = line
  return (
    <li className="flex gap-4 border-b border-line py-5">
      <Link href={`/product/${product.slug}`} onClick={onNavigate} className="w-20 shrink-0">
        <Img image={product.images[0]} ratio="aspect-[4/5]" />
      </Link>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex justify-between gap-3">
          <div>
            <Link href={`/product/${product.slug}`} onClick={onNavigate} className="text-sm hover:text-accent-deep">{product.name}</Link>
            <p className="text-xs text-muted">{t('cart.sizeLine', { size: item.size, price: formatPrice(product.price) })}</p>
          </div>
          <p className="text-sm tabular-nums">{formatPrice(line.subtotal)}</p>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <QuantitySelector value={item.quantity} max={line.maxQuantity} label={t('cart.qtyFor', { name: product.name, size: item.size })} onChange={(n) => setQuantity(item.productId, item.size, n)} />
          <button onClick={() => remove(item.productId, item.size)} aria-label={t('cart.removeAria', { name: product.name, size: item.size })} className="text-xs uppercase tracking-widest text-muted underline-offset-4 hover:text-fg hover:underline">{t('cart.remove')}</button>
        </div>
        {item.quantity >= line.maxQuantity && <p className="text-xs text-accent">{t('cart.max')}</p>}
      </div>
    </li>
  )
}
