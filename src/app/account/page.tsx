import { redirect } from 'next/navigation'
import { AccountView } from '@/features/account/AccountView'
import { titleFor } from '@/i18n/server'
import { getSessionUser } from '@/server/auth'
import { ordersOfUser } from '@/server/orders'

export const generateMetadata = titleFor('acc.title')

export default async function AccountPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login?next=/account')
  return <AccountView initialOrders={ordersOfUser(user.id)} />
}
