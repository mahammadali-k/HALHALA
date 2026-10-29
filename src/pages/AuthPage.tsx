import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Heading } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useCatalog } from '../context/CatalogContext'
import { useI18n } from '../i18n'
import { errorText } from '../lib/errors'

/** Only allow redirects to paths inside this site. */
const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/account')

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { t } = useI18n()
  const { user, ready, login, register } = useAuth()
  const { backend } = useCatalog()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const [v, setV] = useState({ email: '', password: '', name: '', phone: '' })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const isLogin = mode === 'login'
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((s) => ({ ...s, [k]: e.target.value }))

  if (ready && user) return <Navigate to={next} replace />
  if (backend === 'off') return <div className="container-x py-32 text-center text-muted">{t('err.offline')}</div>

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null); setBusy(true)
    try {
      if (isLogin) await login(v.email.trim(), v.password)
      else await register({ email: v.email.trim(), password: v.password, name: v.name.trim(), phone: v.phone.trim() })
      nav(next, { replace: true })
    } catch (err) { setError(errorText(t, err)) } finally { setBusy(false) }
  }
  const other = `${isLogin ? '/register' : '/login'}${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`

  return (
    <div className="container-x max-w-md pt-14">
      <Heading as="h1" title={t(isLogin ? 'acc.login.title' : 'acc.register.title')} reveal={false} />
      <p className="mt-4 text-sm text-muted">{t(isLogin ? 'acc.login.lead' : 'acc.register.lead')}</p>
      <form onSubmit={submit} className="mt-8 space-y-5" aria-label={t(isLogin ? 'acc.login' : 'acc.register')}>
        {!isLogin && (
          <>
            <Labeled id="a-name" label={t('acc.name')}><input id="a-name" className="field" value={v.name} onChange={set('name')} autoComplete="name" required minLength={2} /></Labeled>
            <Labeled id="a-phone" label={`${t('acc.phone')}${t('co.optional')}`}><input id="a-phone" className="field" value={v.phone} onChange={set('phone')} type="tel" autoComplete="tel" /></Labeled>
          </>
        )}
        <Labeled id="a-email" label={t('acc.email')}><input id="a-email" className="field" value={v.email} onChange={set('email')} type="email" autoComplete="email" required /></Labeled>
        <Labeled id="a-pw" label={t('acc.password')} hint={isLogin ? undefined : t('acc.password.hint')}>
          <input id="a-pw" className="field" value={v.password} onChange={set('password')} type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} required minLength={isLogin ? 1 : 8} maxLength={128} />
        </Labeled>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">{t(isLogin ? 'acc.login' : 'acc.register')}</Button>
      </form>
      <p className="mt-6 text-sm text-muted">{t(isLogin ? 'acc.no' : 'acc.have')} <Link to={other} className="text-accent underline-offset-4 hover:text-accent-deep hover:underline">{t(isLogin ? 'acc.register' : 'acc.login')}</Link></p>
    </div>
  )
}

export function Labeled({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-muted">{hint}</p>}
    </div>
  )
}
