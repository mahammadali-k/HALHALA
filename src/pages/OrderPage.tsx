import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { Button, ButtonLink } from '../components/Button'
import { OrderCard } from '../components/OrderCard'
import { Heading } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useI18n, type Key } from '../i18n'
import { api, type Order } from '../lib/api'
import { errorText } from '../lib/errors'

export const LAST_ORDER_KEY = 'halhala.lastOrder'
interface Saved { order: Order; token: string }
const readSaved = (number: string): Saved | null => {
  try { const s = JSON.parse(sessionStorage.getItem(LAST_ORDER_KEY) ?? 'null') as Saved | null; return s?.order.number === number ? s : null } catch { return null }
}

/**
 * Order confirmation / payment result. The order is always (re)loaded from the server — it is the only source of truth
 * for the payment state, which for card payments can arrive after the customer returns from the bank.
 */
export default function OrderPage() {
  const { number = '' } = useParams()
  const { t } = useI18n()
  const { user } = useAuth()
  const location = useLocation()
  const [params] = useSearchParams()
  const saved = useRef(readSaved(number))
  const token = params.get('t') ?? saved.current?.token ?? ''
  const [order, setOrder] = useState<Order | null | undefined>((location.state as { order?: Order } | null)?.order ?? saved.current?.order ?? undefined)
  const [error, setError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)

  const load = useCallback(async () => {
    try { setOrder((await api<{ order: Order }>(`/api/orders/lookup/${number}${token ? `?t=${encodeURIComponent(token)}` : ''}`)).order) } catch { setOrder((o) => o ?? null) }
  }, [number, token])

  useEffect(() => { void load() }, [load, user?.id])
  // Card payment confirmations can lag the redirect from the bank: poll for up to ~2 minutes.
  const waiting = order?.paymentMethod === 'card' && order.paymentStatus === 'pending'
  useEffect(() => {
    if (!waiting) return
    let n = 0
    const h = window.setInterval(() => { if (++n > 40) window.clearInterval(h); else void load() }, 3000)
    return () => window.clearInterval(h)
  }, [waiting, load])

  const payAgain = async () => {
    setError(null)
    try { const r = await api<{ paymentUrl: string }>(`/api/orders/${number}/pay`, { method: 'POST', body: { token } }); setRedirecting(true); window.location.assign(r.paymentUrl) } catch (e) { setError(errorText(t, e)) }
  }

  if (order === undefined) return <div className="container-x py-32 text-center text-muted">{t('acc.loading')}</div>
  if (!order) return (
    <div className="container-x py-32 text-center">
      <p className="text-muted">{t('oc.notfound')}</p>
      <ButtonLink to="/shop" variant="outline" className="mt-6">{t('oc.shop')}</ButtonLink>
    </div>
  )

  const card = order.paymentMethod === 'card'
  const state: 'cod' | 'paid' | 'pending' | 'failed' = !card ? 'cod' : order.paymentStatus === 'paid' ? 'paid' : order.paymentStatus === 'pending' ? 'pending' : 'failed'
  const key = (k: string) => `oc.${k}` as Key
  const open = order.status !== 'cancelled'

  return (
    <div className="container-x max-w-2xl pt-14">
      <Heading as="h1" eyebrow={order.number} title={t(state === 'cod' ? 'oc.title' : key(`${state}.title`))} reveal={false} />
      <p className="mt-5 text-muted" aria-live="polite">{state === 'cod' ? t('oc.d', { number: order.number, phone: order.phone }) : t(key(`${state}.d`), { number: order.number, phone: order.phone })}</p>
      {state === 'cod' && <p className="mt-2 text-sm text-gold">{t('pm.cod.d')}</p>}
      {state === 'failed' && open && order.status === 'new' && (
        <div className="mt-6">
          <Button onClick={() => void payAgain()} disabled={redirecting}>{redirecting ? t('oc.redirecting') : t('oc.payagain')}</Button>
        </div>
      )}
      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
      <div className="mt-8"><OrderCard order={order} showContact /></div>
      <p className="mt-6 text-sm text-muted">{t('oc.keep', { number: order.number })}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink to="/shop">{t('oc.shop')}</ButtonLink>
        {user && <ButtonLink to="/account" variant="outline">{t('oc.account')}</ButtonLink>}
      </div>
      {!user && <p className="mt-6 text-sm text-muted"><Link to="/register" className="text-gold underline-offset-4 hover:text-gold-deep hover:underline">{t('acc.register')}</Link> — {t('acc.register.lead')}</p>}
    </div>
  )
}
