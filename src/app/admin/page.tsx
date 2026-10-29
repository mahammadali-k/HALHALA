import { redirect } from 'next/navigation'
import { AdminView } from '@/features/admin/AdminView'
import { getT, titleFor } from '@/i18n/server'
import { getSessionUser } from '@/server/auth'

export const generateMetadata = titleFor('ad.title')

export default async function AdminPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login?next=/admin')
  if (user.role !== 'admin') return <div className="container-x py-32 text-center text-muted">{(await getT())('ad.forbidden')}</div>
  return <AdminView />
}
