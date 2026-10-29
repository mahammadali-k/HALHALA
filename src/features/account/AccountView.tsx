'use client'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { OrderCard } from '@/components/OrderCard'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Heading } from '@/components/ui/Heading'
import { Notice } from '@/components/ui/Notice'
import { underlineBtn } from '@/components/ui/styles'
import { useAuth } from '@/context/AuthContext'
import { useCatalog } from '@/context/CatalogContext'
import { useI18n } from '@/i18n'
import { api } from '@/lib/api'
import { errorText } from '@/lib/errors'
import type { LiveCatalog, Order } from '@/types/api'

type Msg = { kind: 'ok' | 'error'; text: string } | null

/** Account page: orders (loaded on the server), profile and password forms. The page guarantees a signed-in user. */
export function AccountView({ initialOrders }: { initialOrders: Order[] }) {
  const { t } = useI18n()
  const { user, logout, updateProfile } = useAuth()
  const { applyCatalog } = useCatalog()
  const [orders, setOrders] = useState(initialOrders)
  const [profile, setProfile] = useState({ name: user?.name ?? '', phone: user?.phone ?? '', city: user?.city ?? '', address: user?.address ?? '' })
  const [pw, setPw] = useState({ current: '', next: '' })
  const [msg, setMsg] = useState<Msg>(null)
  const [pwMsg, setPwMsg] = useState<Msg>(null)
  if (!user) return null

  const fail = (e: unknown): Msg => ({ kind: 'error', text: errorText(t, e) })
  const payNow = async (number: string) => {
    try { window.location.assign((await api<{ paymentUrl: string }>(`/api/orders/${number}/pay`, { method: 'POST', body: {} })).paymentUrl) } catch (e) { setMsg(fail(e)) }
  }
  const cancel = async (number: string) => {
    if (!window.confirm(t('acc.cancel.confirm'))) return
    try {
      const r = await api<{ order: Order } & LiveCatalog>(`/api/orders/${number}/cancel`, { method: 'POST', body: {} })
      applyCatalog(r)
      setOrders((o) => o.map((x) => (x.number === number ? r.order : x)))
    } catch (e) { setMsg(fail(e)) }
  }
  const saveProfile = async (e: FormEvent) => {
    e.preventDefault(); setMsg(null)
    try { await updateProfile(profile); setMsg({ kind: 'ok', text: t('acc.saved') }) } catch (err) { setMsg(fail(err)) }
  }
  const changePw = async (e: FormEvent) => {
    e.preventDefault(); setPwMsg(null)
    try { await api('/api/auth/password', { method: 'POST', body: pw }); setPw({ current: '', next: '' }); setPwMsg({ kind: 'ok', text: t('acc.pw.done') }) } catch (err) { setPwMsg(fail(err)) }
  }
  const field = (k: keyof typeof profile, label: Parameters<typeof t>[0], props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <Field id={`p-${k}`} label={t(label)}><input id={`p-${k}`} className="field" value={profile[k]} onChange={(e) => setProfile((s) => ({ ...s, [k]: e.target.value }))} {...props} /></Field>
  )

  return (
    <div className="container-x pt-10 sm:pt-14">
      <Heading as="h1" size="lg" eyebrow={t('acc.title')} title={t('acc.hello', { name: user.name.split(' ')[0] })} reveal={false}
        action={<button onClick={() => void logout()} className={underlineBtn}>{t('acc.logout')}</button>} />
      {user.role === 'admin' && <ButtonLink href="/admin" variant="accent" className="mt-6">{t('acc.admin')}</ButtonLink>}

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="orders-h">
          <h2 id="orders-h" className="font-display text-2xl font-black uppercase text-accent">{t('acc.orders')}</h2>
          <div className="mt-6 space-y-4">
            {orders.length === 0 && (
              <div className="border border-line p-8 text-center text-muted">
                <p>{t('acc.orders.empty')}</p>
                <Link href="/shop" className="mt-3 inline-block text-accent underline-offset-4 hover:text-accent-deep hover:underline">{t('cart.continue')}</Link>
              </div>
            )}
            {orders.map((o) => (
              <OrderCard key={o.number} order={o} showContact>
                {o.paymentMethod === 'card' && o.status === 'new' && (o.paymentStatus === 'pending' || o.paymentStatus === 'failed') && <Button variant="accent" className="!px-4 !py-2.5" onClick={() => void payNow(o.number)}>{t('acc.paynow')}</Button>}
                {o.status === 'new' && o.paymentStatus !== 'paid' && <button onClick={() => void cancel(o.number)} className={underlineBtn}>{t('acc.cancel')}</button>}
              </OrderCard>
            ))}
          </div>
        </section>

        <div className="space-y-12">
          <form onSubmit={(e) => void saveProfile(e)} className="space-y-4" aria-label={t('acc.profile')}>
            <h2 className="font-display text-2xl font-black uppercase text-accent">{t('acc.profile')}</h2>
            <p className="text-sm text-muted">{user.email}</p>
            {field('name', 'acc.name', { autoComplete: 'name', required: true, minLength: 2 })}
            {field('phone', 'acc.phone', { type: 'tel', autoComplete: 'tel' })}
            {field('city', 'acc.city', { autoComplete: 'address-level2' })}
            {field('address', 'acc.address', { autoComplete: 'street-address' })}
            {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
            <Button type="submit" variant="outline">{t('acc.save')}</Button>
          </form>

          <form onSubmit={(e) => void changePw(e)} className="space-y-4" aria-label={t('acc.pw.title')}>
            <h2 className="font-display text-2xl font-black uppercase text-accent">{t('acc.pw.title')}</h2>
            <Field id="pw-cur" label={t('acc.pw.current')}><input id="pw-cur" className="field" type="password" autoComplete="current-password" value={pw.current} onChange={(e) => setPw((s) => ({ ...s, current: e.target.value }))} required /></Field>
            <Field id="pw-new" label={t('acc.pw.new')} hint={t('acc.password.hint')}><input id="pw-new" className="field" type="password" autoComplete="new-password" minLength={8} maxLength={128} value={pw.next} onChange={(e) => setPw((s) => ({ ...s, next: e.target.value }))} required /></Field>
            {pwMsg && <Notice kind={pwMsg.kind}>{pwMsg.text}</Notice>}
            <Button type="submit" variant="outline">{t('acc.pw.change')}</Button>
          </form>
        </div>
      </div>
    </div>
  )
}
