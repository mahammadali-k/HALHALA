import { notFound } from 'next/navigation'
import { OrderView } from '@/features/order/OrderView'
import { titleFor } from '@/i18n/server'
import { orderForPage } from '@/server/orders'

export const generateMetadata = titleFor('tag.order')

export default async function OrderPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string }> }) {
  const { number } = await params
  const token = (await searchParams).t ?? ''
  const order = await orderForPage(number, token)
  if (!order) notFound()
  return <OrderView initialOrder={order} token={token} />
}
