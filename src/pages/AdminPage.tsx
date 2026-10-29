import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Button } from '../components/Button'
import { OrderCard, orderDate } from '../components/OrderCard'
import { Heading } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useCatalog } from '../context/CatalogContext'
import { products } from '../data/products'
import { useI18n, type Key } from '../i18n'
import { api, NEXT_STATUS, type LiveCatalog, type Order, type OrderStatus, type PaymentStatus, type Stats, type UserRow } from '../lib/api'
import { errorText } from '../lib/errors'
import { formatPrice } from '../lib/format'
import type { Size } from '../types'

const STATUSES: OrderStatus[] = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled']
type Tab = 'dashboard' | 'orders' | 'users' | 'catalog'
const TABS: Tab[] = ['dashboard', 'orders', 'users', 'catalog']

export default function AdminPage() {
  const { t } = useI18n()
  const { user, ready } = useAuth()
  const [tab, setTab] = useState<Tab>('dashboard')

  if (!ready) return <div className="container-x py-32 text-center text-muted">{t('acc.loading')}</div>
  if (!user) return <Navigate to="/login?next=/admin" replace />
  if (user.role !== 'admin') return <div className="container-x py-32 text-center text-muted">{t('ad.forbidden')}</div>

  return (
    <div className="container-x pt-14">
      <Heading as="h1" size="lg" title={t('ad.title')} reveal={false} />
      <div role="tablist" className="mt-8 flex flex-wrap gap-1 border-b border-line">
        {TABS.map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`px-4 py-3 text-xs uppercase tracking-[0.2em] transition-colors ${tab === k ? 'border-b-2 border-accent text-fg' : 'text-muted hover:text-fg'}`}>{t(`ad.${k}` as Key)}</button>
        ))}
      </div>
      <div className="mt-8">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'users' && <UsersTab selfId={user.id} />}
        {tab === 'catalog' && <CatalogTab />}
      </div>
    </div>
  )
}

const ExportLink = ({ href }: { href: string }) => {
  const { t } = useI18n()
  return <a href={href} download className="border border-line px-4 py-2.5 text-xs uppercase tracking-[0.2em] transition-colors hover:border-violet hover:bg-violet/25">{t('ad.export')}</a>
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="border border-line bg-card p-5"><p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p><p className="mt-2 font-display text-4xl tabular-nums">{value}</p></div>
}

function Dashboard() {
  const { t } = useI18n()
  const [s, setS] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { api<Stats>('/api/admin/stats').then(setS).catch((e) => setError(errorText(t, e))) }, [t])
  if (!s) return <p className="text-muted">{error ?? t('acc.loading')}</p>
  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label={t('ad.stat.today')} value={s.ordersToday} />
        <Stat label={t('ad.stat.total')} value={s.ordersTotal} />
        <Stat label={t('ad.stat.paid')} value={formatPrice(s.revenuePaid)} />
        <Stat label={t('ad.stat.expected')} value={formatPrice(s.revenueExpected)} />
        <Stat label={t('ad.stat.users')} value={s.users} />
      </div>
      <section>
        <h2 className="mb-4 text-xs uppercase tracking-[0.25em] text-accent">{t('ad.stat.byStatus')}</h2>
        <ul className="flex flex-wrap gap-3">{STATUSES.map((k) => <li key={k} className="border border-line px-4 py-2 text-sm">{t(`st.${k}` as Key)}: <span className="tabular-nums">{s.byStatus[k]}</span></li>)}</ul>
      </section>
      <section>
        <h2 className="mb-4 text-xs uppercase tracking-[0.25em] text-accent">{t('ad.stat.low')}</h2>
        {s.lowStock.length === 0 ? <p className="text-sm text-muted">{t('ad.lowstock.none')}</p> : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{s.lowStock.map((l) => <li key={`${l.productId}${l.size}`} className="flex justify-between border border-line px-4 py-2 text-sm"><span>{l.name} · {l.size}</span><span className={l.qty === 0 ? 'text-danger' : 'text-accent'}>{l.qty}</span></li>)}</ul>
        )}
      </section>
    </div>
  )
}

function OrdersTab() {
  const { t } = useI18n()
  const { applyStock } = useCatalog()
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const h = window.setTimeout(() => {
      const qs = new URLSearchParams({ ...(filter ? { status: filter } : {}), ...(search.trim() ? { q: search.trim() } : {}) }).toString()
      api<{ orders: Order[] }>(`/api/admin/orders${qs ? `?${qs}` : ''}`).then((r) => setOrders(r.orders)).catch((e) => setError(errorText(t, e)))
    }, 250)
    return () => window.clearTimeout(h)
  }, [filter, search, t])

  const patch = async (number: string, body: { status?: OrderStatus; paymentStatus?: PaymentStatus }) => {
    setError(null)
    try {
      const r = await api<{ order: Order } & LiveCatalog>(`/api/admin/orders/${number}`, { method: 'PATCH', body })
      applyStock(r)
      setOrders((o) => (filter && body.status ? o?.filter((x) => x.number !== number) : o?.map((x) => (x.number === number ? r.order : x))) ?? o)
    } catch (e) { setError(errorText(t, e)) }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="ad-search">{t('ad.search')}</label>
        <input id="ad-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('ad.search')} className="field !w-64 !py-2.5" />
        <select aria-label={t('ad.orders')} value={filter} onChange={(e) => { setOrders(null); setFilter(e.target.value) }} className="field !w-auto py-2.5">
          <option value="">{t('ad.all')}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{t(`st.${s}` as Key)}</option>)}
        </select>
        <span className="ml-auto"><ExportLink href="/api/admin/export/orders.csv" /></span>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {orders === null && <p className="text-muted">{t('acc.loading')}</p>}
        {orders?.length === 0 && <p className="text-muted">{t('ad.noorders')}</p>}
        {orders?.map((o) => (
          <OrderCard key={o.number} order={o} showContact>
            {NEXT_STATUS[o.status].map((s) => (
              <Button key={s} variant={s === 'cancelled' ? 'outline' : 'accent'} className="!px-4 !py-2.5" onClick={() => void patch(o.number, { status: s })}>{t(`st.${s}` as Key)}</Button>
            ))}
            {o.status !== 'cancelled' && (
              <button className="text-xs uppercase tracking-widest text-muted underline-offset-4 hover:text-fg hover:underline"
                onClick={() => void patch(o.number, { paymentStatus: o.paymentStatus === 'paid' ? 'unpaid' : 'paid' })}>
                {t(o.paymentStatus === 'paid' ? 'ad.markUnpaid' : 'ad.markPaid')}
              </button>
            )}
          </OrderCard>
        ))}
      </div>
    </div>
  )
}

function UsersTab({ selfId }: { selfId: number }) {
  const { t, lang } = useI18n()
  const [users, setUsers] = useState<UserRow[] | null>(null)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const h = window.setTimeout(() => {
      api<{ users: UserRow[] }>(`/api/admin/users${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''}`).then((r) => setUsers(r.users)).catch((e) => setError(errorText(t, e)))
    }, 250)
    return () => window.clearTimeout(h)
  }, [search, t])

  const setRole = async (id: number, role: 'admin' | 'customer') => {
    setError(null)
    try { await api(`/api/admin/users/${id}`, { method: 'PATCH', body: { role } }); setUsers((u) => u?.map((x) => (x.id === id ? { ...x, role } : x)) ?? u) } catch (e) { setError(errorText(t, e)) }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="ad-usearch">{t('ad.search')}</label>
        <input id="ad-usearch" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('ad.search')} className="field !w-64 !py-2.5" />
        <span className="ml-auto"><ExportLink href="/api/admin/export/users.csv" /></span>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead><tr className="border-b border-line text-xs uppercase tracking-[0.18em] text-muted">
            {['ad.customer', 'acc.phone', 'ad.users.orders', 'ad.users.spent', 'ad.users.joined', 'ad.users.role'].map((k) => <th key={k} className="py-3 pr-4 font-normal">{t(k as Key)}</th>)}
          </tr></thead>
          <tbody>
            {users?.map((u) => (
              <tr key={u.id} className="border-b border-line align-top">
                <td className="py-3 pr-4"><span className="block">{u.name}</span><span className="text-xs text-muted">{u.email}</span>{(u.city || u.address) && <span className="block text-xs text-muted">{[u.city, u.address].filter(Boolean).join(', ')}</span>}</td>
                <td className="py-3 pr-4 tabular-nums">{u.phone || '—'}</td>
                <td className="py-3 pr-4 tabular-nums">{u.orders}</td>
                <td className="py-3 pr-4 tabular-nums">{formatPrice(u.spent)}</td>
                <td className="py-3 pr-4 text-muted">{orderDate(u.createdAt, lang)}</td>
                <td className="py-3">
                  <span className="mr-3">{t(`ad.role.${u.role}` as Key)}</span>
                  {u.id !== selfId && <button onClick={() => void setRole(u.id, u.role === 'admin' ? 'customer' : 'admin')} className="text-xs uppercase tracking-widest text-muted underline-offset-4 hover:text-fg hover:underline">{t(u.role === 'admin' ? 'ad.users.makeCustomer' : 'ad.users.makeAdmin')}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users === null && <p className="mt-4 text-muted">{t('acc.loading')}</p>}
        {users?.length === 0 && <p className="mt-4 text-muted">—</p>}
      </div>
    </div>
  )
}

function CatalogTab() {
  const { t } = useI18n()
  const { applyStock, version } = useCatalog()
  const [live, setLive] = useState<LiveCatalog | null>(null)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { api<LiveCatalog>('/api/stock').then(setLive).catch((e) => setError(errorText(t, e))) }, [t, version])

  const save = async (kind: 'stock' | 'price', productId: string, size?: Size) => {
    const k = `${kind}|${productId}|${size ?? ''}`
    setError(null); setSaved(null)
    try {
      const body = kind === 'stock' ? { productId, size, qty: Number(draft[k]) } : { productId, price: Number(draft[k]) }
      const r = await api<LiveCatalog>(`/api/admin/${kind}`, { method: 'PATCH', body })
      setLive(r); applyStock(r)
      setDraft((d) => { const n = { ...d }; delete n[k]; return n })
      setSaved(k)
    } catch (e) { setError(errorText(t, e)) }
  }

  if (!live) return <p className="text-muted">{error ?? t('acc.loading')}</p>
  const input = (k: string, current: string, w: string, onSave: () => void, id: string) => (
    <div className="flex">
      <input id={id} type="number" min={0} step={k.startsWith('price') ? '0.01' : '1'} value={draft[k] ?? current} onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))} className={`field ${w} !py-2`} />
      {draft[k] !== undefined && <button onClick={onSave} className="border border-l-0 border-line px-2 text-xs text-accent hover:bg-violet hover:text-fg">{t('ad.stock.save')}</button>}
      {saved === k && <span className="ml-2 self-center text-xs text-emerald-300">✓ {t('ad.saved')}</span>}
    </div>
  )
  return (
    <div>
      <p className="mb-6 text-sm text-muted">{t('ad.catalog.hint')}</p>
      {error && <p role="alert" className="mb-4 text-sm text-danger">{error}</p>}
      <div className="space-y-4">
        {products.map((p) => (
          <div key={p.id} className="grid gap-4 border border-line bg-card p-4 md:grid-cols-[14rem_9rem_1fr] md:items-start">
            <div><p className="text-sm">{p.name}</p><p className="text-xs text-muted">{p.slug}</p></div>
            <div><label htmlFor={`pr-${p.id}`} className="mb-1 block text-xs text-muted">{t('ad.price')}</label>{input(`price|${p.id}|`, String(live.prices?.[p.id] ?? p.price), '!w-24', () => void save('price', p.id), `pr-${p.id}`)}</div>
            <div>
              <p className="mb-1 text-xs text-muted">{t('ad.stock')}</p>
              <div className="flex flex-wrap gap-3">
                {(Object.keys(p.stock) as Size[]).map((s) => (
                  <div key={s}><label htmlFor={`st-${p.id}-${s}`} className="mb-1 block text-xs text-muted">{s}</label>{input(`stock|${p.id}|${s}`, String(live.stock[p.id]?.[s] ?? 0), '!w-20', () => void save('stock', p.id, s), `st-${p.id}-${s}`)}</div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
