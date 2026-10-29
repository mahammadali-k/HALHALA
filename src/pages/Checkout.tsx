import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, ButtonLink } from '../components/Button'
import { ContactActions } from '../components/ContactActions'
import { Heading } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'
import { useI18n, type Key } from '../i18n'
import { api, ApiError, deliveryFeeFor, type LiveCatalog, type Order } from '../lib/api'
import { errorText } from '../lib/errors'
import { formatPrice } from '../lib/format'
import { buildOrderMessage, validateCheckout, type CheckoutErrors, type CheckoutValues } from '../lib/orders'
import { LAST_ORDER_KEY } from './OrderPage'

const empty: CheckoutValues = { name: '', phone: '', email: '', city: '', address: '', notes: '' }

function Field({ id, label, error, optional, children }: { id: string; label: string; error?: string; optional?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted">
        {label}{optional && <span className="normal-case tracking-normal">{optional}</span>}
      </label>
      {children}
      {error && <p id={`${id}-err`} role="alert" className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  )
}

export default function Checkout() {
  const { lines, total, clear } = useCart()
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const { backend, config, applyStock, refreshStock } = useCatalog()
  const nav = useNavigate()
  const [v, setV] = useState(empty)
  const [errors, setErrors] = useState<CheckoutErrors>({})
  const [message, setMessage] = useState<string | null>(null) // DM fallback only
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [method, setMethod] = useState('cod')
  const [redirecting, setRedirecting] = useState(false)

  // Pre-fill from the logged-in user's profile (only fields the visitor hasn't typed yet).
  useEffect(() => {
    if (!user) return
    setV((s) => ({ ...s, name: s.name || user.name, phone: s.phone || user.phone, email: s.email || user.email, city: s.city || user.city, address: s.address || user.address }))
  }, [user])
  // Make sure the stock the visitor sees is current while they check out.
  useEffect(() => { if (backend === 'on') void refreshStock() }, [backend, refreshStock])

  if (lines.length === 0 && !message) {
    return (
      <div className="container-x py-32 text-center">
        <h1 className="display text-h2">{t('co.empty.t')}</h1>
        <p className="mt-3 text-muted">{t('co.empty.d')}</p>
        <ButtonLink to="/shop" variant="outline" className="mt-8">{t('cart.continue')}</ButtonLink>
      </div>
    )
  }
  if (backend === 'loading') return <div className="container-x py-32 text-center text-muted">{t('co.checking')}</div>

  const online = backend === 'on'
  const fee = deliveryFeeFor(config, total)
  const payments = config?.payments ?? []

  const set = (k: keyof CheckoutValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setV((s) => ({ ...s, [k]: e.target.value }))
    if (errors[k]) setErrors((s) => ({ ...s, [k]: undefined }))
  }
  const props = (k: keyof CheckoutValues) => ({
    id: k, value: v[k], onChange: set(k), className: 'field', 'aria-invalid': !!errors[k], 'aria-describedby': errors[k] ? `${k}-err` : undefined,
  })
  const field = (k: keyof CheckoutValues, label: Key, optional = false) => ({ id: k, label: t(label), error: errors[k], optional: optional ? t('co.optional') : undefined })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const errs = validateCheckout(v, t)
    setErrors(errs)
    const first = Object.keys(errs)[0]
    if (first) return document.getElementById(first)?.focus()

    if (!online) return setMessage(buildOrderMessage(lines, total, v, t)) // no backend: prepare a DM message instead

    setBusy(true)
    try {
      const r = await api<{ order: Order; token: string; paymentUrl: string | null } & LiveCatalog>('/api/orders', {
        method: 'POST',
        body: { items: lines.map((l) => ({ productId: l.item.productId, size: l.item.size, quantity: l.item.quantity })), contact: v, paymentMethod: method, lang },
      })
      applyStock(r)
      try { sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify({ order: r.order, token: r.token })) } catch { /* ignore */ }
      clear() // the order exists and its stock is reserved
      if (r.paymentUrl) { setRedirecting(true); window.location.assign(r.paymentUrl); return } // card: continue on the bank's page
      nav(`/order/${r.order.number}`, { state: { order: r.order } })
    } catch (err) {
      if (err instanceof ApiError && err.code === 'out_of_stock') { await refreshStock() } // cart trims itself to what is left
      if (err instanceof ApiError && err.code === 'invalid_input' && err.data.fields) {
        const f = err.data.fields as Record<string, string>
        setErrors(Object.fromEntries(Object.keys(f).map((k) => [k, t(`v.${k}` as Key)])))
      }
      setFormError(errorText(t, err))
    } finally { setBusy(false) }
  }

  return (
    <div className="container-x pt-14">
      <Heading as="h1" size="lg" title={t('co.title')} reveal={false} />

      {online ? (
        <div role="note" className="mt-8 border border-line bg-card p-4 text-sm text-muted">
          <p className="text-fg">{t('co.on.t')}</p>
          <p className="mt-1">{t('co.on.d')}</p>
          {!user && <p className="mt-2"><Link to="/login?next=/checkout" className="text-accent underline-offset-4 hover:text-accent-deep hover:underline">{t('acc.guest')}</Link></p>}
        </div>
      ) : (
        <div role="note" className="mt-8 border border-accent/60 bg-card p-4 text-sm text-muted">
          <p className="text-fg">{t('co.note.t')}</p>
          <p className="mt-1">{t('co.note.d')}</p>
        </div>
      )}

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_24rem]">
        {message ? (
          <section aria-labelledby="ready-h" className="space-y-5">
            <h2 id="ready-h" className="font-display text-4xl">{t('co.ready')}</h2>
            <p className="text-sm text-muted">{t('co.ready.d')}</p>
            <pre className="overflow-x-auto whitespace-pre-wrap border border-line bg-ink-2 p-4 text-sm">{message}</pre>
            <ContactActions message={message} />
            <Button variant="outline" onClick={() => setMessage(null)}>{t('co.edit')}</Button>
            <div>
              <button onClick={() => { clear(); setMessage(null); setV(empty) }} className="text-xs uppercase tracking-widest text-muted underline-offset-4 hover:text-fg hover:underline">{t('co.clear')}</button>
            </div>
          </section>
        ) : (
          <form onSubmit={(e) => void submit(e)} noValidate className="space-y-6" aria-label={t('co.form')}>
            <h2 className="text-xs uppercase tracking-[0.25em] text-accent">{t('co.contact')}</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field {...field('name', 'co.name')}><input {...props('name')} autoComplete="name" /></Field>
              <Field {...field('phone', 'co.phone')}><input {...props('phone')} type="tel" inputMode="tel" autoComplete="tel" /></Field>
            </div>
            <Field {...field('email', 'co.email', true)}><input {...props('email')} type="email" autoComplete="email" /></Field>
            <h2 className="pt-4 text-xs uppercase tracking-[0.25em] text-accent">{t('co.address.h')}</h2>
            <Field {...field('city', 'co.city')}><input {...props('city')} autoComplete="address-level2" /></Field>
            <Field {...field('address', 'co.address')}><input {...props('address')} autoComplete="street-address" /></Field>
            <Field {...field('notes', 'co.notes', true)}><textarea {...props('notes')} rows={3} /></Field>

            {online && (
              <fieldset className="space-y-3">
                <legend className="mb-3 text-xs uppercase tracking-[0.25em] text-accent">{t('co.pay')}</legend>
                {payments.map((m) => (
                  <label key={m} className="flex cursor-pointer items-start gap-3 border border-line p-4 has-[:checked]:border-accent-deep has-[:checked]:bg-card">
                    <input type="radio" name="pay" value={m} checked={method === m} onChange={() => setMethod(m)} className="mt-1 accent-[#8a5fe0]" />
                    <span><span className="block text-sm">{t(`pm.${m}` as Key)}</span><span className="block text-xs text-muted">{t(`pm.${m}.d` as Key)}</span></span>
                  </label>
                ))}
              </fieldset>
            )}

            {formError && <p role="alert" className="border border-danger/50 p-3 text-sm text-danger">{formError}</p>}
            <Button type="submit" disabled={busy || redirecting} className="w-full sm:w-auto">{redirecting ? t('oc.redirecting') : busy ? t('co.placing') : t(online ? 'co.place' : 'co.submit')}</Button>
            {online && (
              <div className="border-t border-line pt-6">
                <p className="mb-3 text-xs uppercase tracking-widest text-muted">{t('co.or')}</p>
                <ContactActions message={buildOrderMessage(lines, total, { ...empty, ...v, name: v.name || '—', phone: v.phone || '—', city: v.city || '—', address: v.address || '—' }, t)} variant="outline" />
              </div>
            )}
          </form>
        )}

        <aside className="h-fit border border-line bg-card p-6" aria-label={t('co.summary')}>
          <h2 className="text-xs uppercase tracking-[0.25em] text-accent">{t('co.summary')}</h2>
          <ul className="mt-5 divide-y divide-line">
            {lines.map((l) => (
              <li key={l.key} className="flex justify-between gap-3 py-3 text-sm">
                <span>{l.product.name}<span className="block text-xs text-muted">{l.item.size} × {l.item.quantity}</span></span>
                <span className="tabular-nums">{formatPrice(l.subtotal)}</span>
              </li>
            ))}
          </ul>
          {online && config && config.deliveryFee > 0 && (
            <div className="flex justify-between border-t border-line pt-3 text-sm"><span className="text-muted">{t('co.fee')}</span><span className="tabular-nums">{fee === 0 ? t('co.fee.free') : formatPrice(fee)}</span></div>
          )}
          <div className="mt-3 flex justify-between border-t border-line pt-4"><span>{t('co.total')}</span><span className="tabular-nums">{formatPrice(total + (online ? fee : 0))}</span></div>
          {!(online && config && config.deliveryFee > 0) && <p className="mt-2 text-xs text-muted">{t('co.deliveryNote')}</p>}
          <Link to="/cart" className="mt-4 inline-block text-xs uppercase tracking-widest text-muted underline-offset-4 hover:text-fg hover:underline">{t('co.editcart')}</Link>
        </aside>
      </div>
    </div>
  )
}
