'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { OrderCard, orderDate } from '@/components/OrderCard'
import { Heading } from '@/components/ui/Heading'
import { useAuth } from '@/context/AuthContext'
import { useCatalog } from '@/context/CatalogContext'
import { ProductsTab } from './ProductsTab'
import { SettingsTab } from './SettingsTab'
import { useI18n, type Key } from '@/i18n'
import { api } from '@/lib/api'
import { NEXT_STATUS, type LiveCatalog, type Order, type OrderStatus, type PaymentStatus, type Stats, type UserRow } from '@/types/api'
import { errorText } from '@/lib/errors'
import { formatPrice } from '@/lib/format'

const STATUSES: OrderStatus[] = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled']
type Tab = 'dashboard' | 'orders' | 'products' | 'users' | 'settings'
const TABS: Tab[] = ['dashboard', 'orders', 'products', 'users', 'settings']

/** Admin panel. The server page guarantees an admin session; this is only the interactive UI. */
export function AdminView() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('dashboard')
  if (user?.role !== 'admin') return null

  return (
    <div className="container-x pt-10 sm:pt-14">
      <Heading as="h1" size="lg" title={t('ad.title')} reveal={false} />
      <div role="tablist" className="mt-8 flex flex-wrap gap-1 border-b border-line">
        {TABS.map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] transition-colors ${tab === k ? 'border-b-2 border-accent text-fg' : 'text-muted hover:text-fg'}`}>{t(`ad.${k}` as Key)}</button>
        ))}
      </div>
      <div className="mt-8">
        {tab === 'dashboard' && <Dashboard />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'users' && <UsersTab selfId={user.id} />}
        {tab === 'products' && <ProductsTab />}
        {tab === 'settings' && <SettingsTab />}
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
  const { applyCatalog } = useCatalog()
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
      applyCatalog(r)
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

  const [temp, setTemp] = useState<{ id: number; pw: string } | null>(null)
  const resetPw = async (id: number) => {
    if (!window.confirm(t('ad.users.resetConfirm'))) return
    setError(null)
    try { setTemp({ id, pw: (await api<{ temporaryPassword: string }>(`/api/admin/users/${id}/password`, { method: 'POST', body: {} })).temporaryPassword }) } catch (e) { setError(errorText(t, e)) }
  }
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
                  {u.id !== selfId && <button onClick={() => void resetPw(u.id)} className="mr-3 text-xs uppercase tracking-widest text-muted underline-offset-4 hover:text-fg hover:underline">{t('ad.users.reset')}</button>}
                  {temp?.id === u.id && <span className="mr-3 select-all border border-accent px-2 py-1 font-mono text-xs">{temp.pw}</span>}
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
