import { CheckoutView } from '@/features/checkout/CheckoutView'
import { titleFor } from '@/i18n/server'

export const generateMetadata = titleFor('co.title')
export default function CheckoutPage() { return <CheckoutView /> }
