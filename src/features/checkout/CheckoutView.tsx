'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Heading } from '@/components/ui/Heading'
import { Notice } from '@/components/ui/Notice'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { useCatalog } from '@/context/CatalogContext'
import { useI18n, type Key } from '@/i18n'
import { api, ApiError, deliveryFeeFor } from '@/lib/api'
import { validateCheckout, type CheckoutErrors } from '@/lib/checkout'
import { errorText } from '@/lib/errors'
import { formatPrice } from '@/lib/format'
import type { CheckoutContact, CreatedOrder } from '@/types/api'

const empty: CheckoutContact = { name: '', phone: '', email: '', city: '', address: '', notes: '' }

export function CheckoutView() {
  const { lines, total, clear } = useCart()
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const { config, store, applyCatalog, refresh } = useCatalog()
  const router = useRouter()
  const [v, setV] = useState(empty)
  const [errors, setErrors] = useState<CheckoutErrors>({})
  const [busy, setBusy] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [method, setMethod] = useState('cod')

  // Pre-fill from the logged-in user's profile (only fields the visitor has not typed yet).
  useEffect(() => {
    if (user) setV((s) => ({ name: s.name || user.name, phone: s.phone || user.phone, email: s.email || user.email, city: s.city || user.city, address: s.address || user.address, notes: s.notes }))
  }, [user])
  useEffect(() => { void refresh() }, [refresh]) // make sure the stock shown is current while checking out

  if (lines.length === 0 && !redirecting) {
    return (
      <div className="container-x py-32 text-center">
        <h1 className="display text-h2">{t('co.empty.t')}</h1>
        <p className="mt-3 text-muted">{t('co.empty.d')}</p>
        <ButtonLink href="/shop" variant="outline" className="mt-8">{t('cart.continue')}</ButtonLink>
      </div>
    )
  }

  const fee = deliveryFeeFor(store, total)
  const showFee = store.deliveryFee > 0

  /** A text input bound to one contact field. */
  const text = (k: keyof CheckoutContact, label: Key, props: React.InputHTMLAttributes<HTMLInputElement> = {}, optional = false) => (
    <Field id={k} label={t(label)} error={errors[k]} optional={optional ? t('co.optional') : undefined}>
      <input id={k} className="field" value={v[k]} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `${k}-err` : undefined}
        onChange={(e) => { setV((s) => ({ ...s, [k]: e.target.value })); if (errors[k]) setErrors((s) => ({ ...s, [k]: undefined })) }} {...props} />
    </Field>
  )

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const errs = validateCheckout(v, t)
    setErrors(errs)
    const first = Object.keys(errs)[0]
    if (first) return document.getElementById(first)?.focus()

    setBusy(true)
    try {
      const r = await api<CreatedOrder>('/api/orders', {
        method: 'POST',
        body: { items: lines.map((l) => ({ productId: l.item.productId, size: l.item.size, quantity: l.item.quantity })), contact: v, paymentMethod: method, lang },
      })
      applyCatalog(r)
      clear() // the order exists and its stock is reserved
      setRedirecting(true)
      if (r.paymentUrl) window.location.assign(r.paymentUrl) // card: continue on the bank's page
      else router.push(`/order/${r.order.number}?t=${r.token}`)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'out_of_stock') await refresh() // the cart trims itself to what is left
      if (err instanceof ApiError && err.code === 'invalid_input' && err.data.fields) {
        setErrors(Object.fromEntries(Object.keys(err.data.fields as object).map((k) => [k, t(`v.${k}` as Key)])))
      }
      setFormError(errorText(t, err))
    } finally { setBusy(false) }
  }

  return (
    <div className="container-x pt-10 sm:pt-14">
      <Heading as="h1" size="lg" title={t('co.title')} reveal={false} />

      <div role="note" className="mt-8 border border-line bg-card p-4 text-sm text-muted">
        <p className="text-fg">{t('co.on.t')}</p>
        <p className="mt-1">{t('co.on.d')}</p>
        {!user && <p className="mt-2"><Link href="/login?next=/checkout" className="text-accent underline-offset-4 hover:text-accent-deep hover:underline">{t('acc.guest')}</Link></p>}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_24rem] lg:gap-12">
        <form onSubmit={(e) => void submit(e)} noValidate className="space-y-6" aria-label={t('co.form')}>
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-accent">{t('co.contact')}</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {text('name', 'co.name', { autoComplete: 'name' })}
            {text('phone', 'co.phone', { type: 'tel', inputMode: 'tel', autoComplete: 'tel' })}
          </div>
          {text('email', 'co.email', { type: 'email', autoComplete: 'email' }, true)}
          <h2 className="pt-4 font-mono text-xs uppercase tracking-[0.25em] text-accent">{t('co.address.h')}</h2>
          {text('city', 'co.city', { autoComplete: 'address-level2' })}
          {text('address', 'co.address', { autoComplete: 'street-address' })}
          <Field id="notes" label={t('co.notes')} optional={t('co.optional')}>
            <textarea id="notes" className="field" rows={3} value={v.notes} onChange={(e) => setV((s) => ({ ...s, notes: e.target.value }))} />
          </Field>

          <fieldset className="space-y-3">
            <legend className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-accent">{t('co.pay')}</legend>
            {config.payments.map((m) => (
              <label key={m} className="flex cursor-pointer items-start gap-3 border border-line p-4 has-[:checked]:border-accent-deep has-[:checked]:bg-card">
                <input type="radio" name="pay" value={m} checked={method === m} onChange={() => setMethod(m)} className="mt-1 accent-[#8a5fe0]" />
                <span><span className="block text-sm">{t(`pm.${m}` as Key)}</span><span className="block text-xs text-muted">{t(`pm.${m}.d` as Key)}</span></span>
              </label>
            ))}
          </fieldset>

          {formError && <Notice kind="error">{formError}</Notice>}
          <Button type="submit" disabled={busy || redirecting} className="w-full sm:w-auto">{redirecting ? t('oc.redirecting') : busy ? t('co.placing') : t('co.place')}</Button>
        </form>

        <aside className="h-fit border border-line bg-card p-6" aria-label={t('co.summary')}>
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-accent">{t('co.summary')}</h2>
          <ul className="mt-5 divide-y divide-line">
            {lines.map((l) => (
              <li key={l.key} className="flex justify-between gap-3 py-3 text-sm">
                <span>{l.product.name}<span className="block text-xs text-muted">{l.item.size} × {l.item.quantity}</span></span>
                <span className="tabular-nums">{formatPrice(l.subtotal)}</span>
              </li>
            ))}
          </ul>
          {showFee && <div className="flex justify-between border-t border-line pt-3 text-sm"><span className="text-muted">{t('co.fee')}</span><span className="tabular-nums">{fee === 0 ? t('co.fee.free') : formatPrice(fee)}</span></div>}
          <div className="mt-3 flex justify-between border-t border-line pt-4"><span>{t('co.total')}</span><span className="tabular-nums">{formatPrice(total + fee)}</span></div>
          {!showFee && <p className="mt-2 text-xs text-muted">{t('co.deliveryNote')}</p>}
          <Link href="/cart" className="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-muted underline-offset-4 hover:text-fg hover:underline">{t('co.editcart')}</Link>
        </aside>
      </div>
    </div>
  )
}
