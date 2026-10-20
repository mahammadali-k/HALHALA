import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Button, ButtonLink } from '../components/Button'
import { OrderCard } from '../components/OrderCard'
import { Heading, underlineBtn } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useCatalog } from '../context/CatalogContext'
import { useI18n } from '../i18n'
import { api, type LiveCatalog, type Order } from '../lib/api'
import { errorText } from '../lib/errors'
import { Labeled } from './AuthPage'

export default function AccountPage() {
  const { t } = useI18n()
  const { user, ready, logout, updateProfile } = useAuth()
  const { applyStock, backend } = useCatalog()
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [profile, setProfile] = useState({ name: '', phone: '', city: '', address: '' })
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [pw, setPw] = useState({ current: '', next: '' })
  const [pwMsg, setPwMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => { if (user) setProfile({ name: user.name, phone: user.phone, city: user.city, address: user.address }) }, [user])
  useEffect(() => {
    if (!user) return
    api<{ orders: Order[] }>('/api/orders/mine').then((r) => setOrders(r.orders)).catch(() => setOrders([]))
  }, [user])

  const payNow = useCallback(async (number: string) => {
    try { window.location.assign((await api<{ paymentUrl: string }>(`/api/orders/${number}/pay`, { method: 'POST', body: {} })).paymentUrl) } catch (e) { setMsg({ kind: 'err', text: errorText(t, e) }) }
  }, [t])

  const cancel = useCallback(async (number: string) => {
    if (!window.confirm(t('acc.cancel.confirm'))) return
    try {
      const r = await api<{ order: Order } & LiveCatalog>(`/api/orders/${number}/cancel`, { method: 'POST', body: {} })
      applyStock(r)
      setOrders((o) => o?.map((x) => (x.number === number ? r.order : x)) ?? o)
    } catch (e) { setMsg({ kind: 'err', text: errorText(t, e) }) }
  }, [applyStock, t])

  if (!ready) return <div className="container-x py-32 text-center text-muted">{t('acc.loading')}</div>
  if (backend === 'off') return <div className="container-x py-32 text-center text-muted">{t('err.offline')}</div>
  if (!user) return <Navigate to="/login?next=/account" replace />

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault(); setMsg(null)
    try { await updateProfile(profile); setMsg({ kind: 'ok', text: t('acc.saved') }) } catch (err) { setMsg({ kind: 'err', text: errorText(t, err) }) }
  }
  const changePw = async (e: FormEvent) => {
    e.preventDefault(); setPwMsg(null)
    try { await api('/api/auth/password', { method: 'POST', body: pw }); setPw({ current: '', next: '' }); setPwMsg({ kind: 'ok', text: t('acc.pw.done') }) } catch (err) { setPwMsg({ kind: 'err', text: errorText(t, err) }) }
  }
  const p = (k: keyof typeof profile) => ({ value: profile[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setProfile((s) => ({ ...s, [k]: e.target.value })), className: 'field' })
  const note = (m: typeof msg) => m && <p role={m.kind === 'err' ? 'alert' : 'status'} className={`text-sm ${m.kind === 'err' ? 'text-danger' : 'text-emerald-300'}`}>{m.text}</p>

  return (
    <div className="container-x pt-14">
      <Heading as="h1" size="lg" eyebrow={t('acc.title')} title={t('acc.hello', { name: user.name.split(' ')[0] })} reveal={false}
        action={<button onClick={() => void logout()} className={underlineBtn}>{t('acc.logout')}</button>} />
      {user.role === 'admin' && <ButtonLink to="/admin" variant="gold" className="mt-6">{t('acc.admin')}</ButtonLink>}

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="orders-h">
          <h2 id="orders-h" className="font-display text-3xl text-gold">{t('acc.orders')}</h2>
          <div className="mt-6 space-y-4">
            {orders === null && <p className="text-muted">{t('acc.loading')}</p>}
            {orders?.length === 0 && (
              <div className="border border-line p-8 text-center text-muted">
                <p>{t('acc.orders.empty')}</p>
                <Link to="/shop" className="mt-3 inline-block text-gold underline-offset-4 hover:text-gold-deep hover:underline">{t('cart.continue')}</Link>
              </div>
            )}
            {orders?.map((o) => (
              <OrderCard key={o.number} order={o} showContact>
                {o.paymentMethod === 'card' && o.status === 'new' && (o.paymentStatus === 'pending' || o.paymentStatus === 'failed') && <Button variant="gold" className="!px-4 !py-2.5" onClick={() => void payNow(o.number)}>{t('acc.paynow')}</Button>}
                {o.status === 'new' && o.paymentStatus !== 'paid' && <button onClick={() => void cancel(o.number)} className={underlineBtn}>{t('acc.cancel')}</button>}
              </OrderCard>
            ))}
          </div>
        </section>

        <div className="space-y-12">
          <form onSubmit={saveProfile} className="space-y-4" aria-label={t('acc.profile')}>
            <h2 className="font-display text-3xl text-gold">{t('acc.profile')}</h2>
            <p className="text-sm text-muted">{user.email}</p>
            <Labeled id="p-name" label={t('acc.name')}><input id="p-name" {...p('name')} autoComplete="name" required minLength={2} /></Labeled>
            <Labeled id="p-phone" label={t('acc.phone')}><input id="p-phone" {...p('phone')} type="tel" autoComplete="tel" /></Labeled>
            <Labeled id="p-city" label={t('acc.city')}><input id="p-city" {...p('city')} autoComplete="address-level2" /></Labeled>
            <Labeled id="p-addr" label={t('acc.address')}><input id="p-addr" {...p('address')} autoComplete="street-address" /></Labeled>
            {note(msg)}
            <Button type="submit" variant="outline">{t('acc.save')}</Button>
          </form>

          <form onSubmit={changePw} className="space-y-4" aria-label={t('acc.pw.title')}>
            <h2 className="font-display text-3xl text-gold">{t('acc.pw.title')}</h2>
            <Labeled id="pw-cur" label={t('acc.pw.current')}><input id="pw-cur" className="field" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw((s) => ({ ...s, current: e.target.value }))} required /></Labeled>
            <Labeled id="pw-new" label={t('acc.pw.new')} hint={t('acc.password.hint')}><input id="pw-new" className="field" type="password" autoComplete="new-password" minLength={8} maxLength={128} value={pw.next} onChange={(e) => setPw((s) => ({ ...s, next: e.target.value }))} required /></Labeled>
            {note(pwMsg)}
            <Button type="submit" variant="outline">{t('acc.pw.change')}</Button>
          </form>
        </div>
      </div>
    </div>
  )
}
