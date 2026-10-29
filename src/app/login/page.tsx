import { redirect } from 'next/navigation'
import { AuthForm } from '@/features/account/AuthForm'
import { titleFor } from '@/i18n/server'
import { safeNext } from '@/lib/validate'
import { getSessionUser } from '@/server/auth'

export const generateMetadata = titleFor('acc.login')

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next)
  if (await getSessionUser()) redirect(next) // already signed in
  return <AuthForm mode="login" next={next} />
}
