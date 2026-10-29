'use client'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { OrderCard } from '@/components/OrderCard'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Heading } from '@/components/ui/Heading'
import { Notice } from '@/components/ui/Notice'
import { useAuth } from '@/context/AuthContext'
import { useI18n, type Key } from '@/i18n'
import { api } from '@/lib/api'
import { errorText } from '@/lib/errors'
import type { Order } from '@/types/api'

/**
 * Order confirmation / payment result. The server page loads the order (via the secret `?t=` link or the owner's session);
 * for card payments the status is polled because the bank's confirmation can arrive after the customer is back.
 */
export function OrderView({ initialOrder, token }: { initialOrder: Order; token: string }) {
  const { t } = useI18n()
  const { user } = useAuth()
  const [order, setOrder] = useState(initialOrder)
  const [error, setError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)
  const number = order.number

  const reload = useCallback(async () => {
    try { setOrder((await api<{ order: Order }>(`/api/orders/lookup/${number}${token ? `?t=${encodeURIComponent(token)}` : ''}`)).order) } catch { /* keep what we have */ }
  }, [number, token])

  const waiting = order.paymentMethod === 'card' && order.paymentStatus === 'pending'
  useEffect(() => {
    if (!waiting) return
    let n = 0
    const h = window.setInterval(() => { if (++n > 40) window.clearInterval(h); else void reload() }, 3000) // ~2 minutes
    return () => window.clearInterval(h)
  }, [waiting, reload])

  const payAgain = async () => {
    setError(null)
    try { const r = await api<{ paymentUrl: string }>(`/api/orders/${number}/pay`, { method: 'POST', body: { token } }); setRedirecting(true); window.location.assign(r.paymentUrl) } catch (e) { setError(errorText(t, e)) }
  }

  const card = order.paymentMethod === 'card'
  const state: 'cod' | 'paid' | 'pending' | 'failed' = !card ? 'cod' : order.paymentStatus === 'paid' ? 'paid' : order.paymentStatus === 'pending' ? 'pending' : 'failed'
  const key = (k: string) => `oc.${k}` as Key

  return (
    <div className="container-x max-w-2xl pt-10 sm:pt-14">
      <Heading as="h1" eyebrow={number} title={t(state === 'cod' ? 'oc.title' : key(`${state}.title`))} reveal={false} />
      <p className="mt-5 text-muted" aria-live="polite">{state === 'cod' ? t('oc.d', { number, phone: order.phone }) : t(key(`${state}.d`), { number, phone: order.phone })}</p>
      {state === 'cod' && <p className="mt-2 text-sm text-accent">{t('pm.cod.d')}</p>}
      {state === 'failed' && order.status === 'new' && <div className="mt-6"><Button onClick={() => void payAgain()} disabled={redirecting}>{redirecting ? t('oc.redirecting') : t('oc.payagain')}</Button></div>}
      {error && <div className="mt-4"><Notice kind="error">{error}</Notice></div>}
      <div className="mt-8"><OrderCard order={order} showContact /></div>
      <p className="mt-6 text-sm text-muted">{t('oc.keep', { number })}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/shop">{t('oc.shop')}</ButtonLink>
        {user && <ButtonLink href="/account" variant="outline">{t('oc.account')}</ButtonLink>}
      </div>
      {!user && <p className="mt-6 text-sm text-muted"><Link href="/register" className="text-accent underline-offset-4 hover:text-accent-deep hover:underline">{t('acc.register')}</Link> — {t('acc.register.lead')}</p>}
    </div>
  )
}
