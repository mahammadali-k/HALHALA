'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Heading } from '@/components/ui/Heading'
import { Notice } from '@/components/ui/Notice'
import { useAuth } from '@/context/AuthContext'
import { useI18n } from '@/i18n'
import { errorText } from '@/lib/errors'

/** Login / registration form. The page (server) redirects signed-in visitors away and validates `next`. */
export function AuthForm({ mode, next }: { mode: 'login' | 'register'; next: string }) {
  const { t } = useI18n()
  const { login, register } = useAuth()
  const router = useRouter()
  const [v, setV] = useState({ email: '', password: '', name: '', phone: '' })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const isLogin = mode === 'login'
  const bind = (k: keyof typeof v) => ({ id: `a-${k}`, className: 'field', value: v[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setV((s) => ({ ...s, [k]: e.target.value })) })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null); setBusy(true)
    try {
      if (isLogin) await login(v.email.trim(), v.password)
      else await register({ email: v.email.trim(), password: v.password, name: v.name.trim(), phone: v.phone.trim() })
      router.replace(next)
    } catch (err) { setError(errorText(t, err)); setBusy(false) }
  }
  const other = `${isLogin ? '/register' : '/login'}?next=${encodeURIComponent(next)}`

  return (
    <div className="container-x max-w-md pt-10 sm:pt-14">
      <Heading as="h1" title={t(isLogin ? 'acc.login.title' : 'acc.register.title')} reveal={false} />
      <p className="mt-4 text-sm text-muted">{t(isLogin ? 'acc.login.lead' : 'acc.register.lead')}</p>
      <form onSubmit={(e) => void submit(e)} className="mt-8 space-y-5" aria-label={t(isLogin ? 'acc.login' : 'acc.register')}>
        {!isLogin && (
          <>
            <Field id="a-name" label={t('acc.name')}><input {...bind('name')} autoComplete="name" required minLength={2} /></Field>
            <Field id="a-phone" label={t('acc.phone')} optional={t('co.optional')}><input {...bind('phone')} type="tel" autoComplete="tel" /></Field>
          </>
        )}
        <Field id="a-email" label={t('acc.email')}><input {...bind('email')} type="email" autoComplete="email" required /></Field>
        <Field id="a-password" label={t('acc.password')} hint={isLogin ? undefined : t('acc.password.hint')}>
          <input {...bind('password')} type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} required minLength={isLogin ? 1 : 8} maxLength={128} />
        </Field>
        {error && <Notice kind="error">{error}</Notice>}
        <Button type="submit" disabled={busy} className="w-full">{t(isLogin ? 'acc.login' : 'acc.register')}</Button>
      </form>
      <p className="mt-6 text-sm text-muted">{t(isLogin ? 'acc.no' : 'acc.have')} <Link href={other} className="text-accent underline-offset-4 hover:text-accent-deep hover:underline">{t(isLogin ? 'acc.register' : 'acc.login')}</Link></p>
    </div>
  )
}
