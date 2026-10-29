import { CartView } from '@/features/cart/CartView'
import { titleFor } from '@/i18n/server'

export const generateMetadata = titleFor('cart.title')
export default function CartPage() { return <CartView /> }
