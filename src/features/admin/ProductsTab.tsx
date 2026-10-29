'use client'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { Img } from '@/components/ui/Img'
import { useCatalog } from '@/context/CatalogContext'
import { useI18n, type Key } from '@/i18n'
import { api, ApiError } from '@/lib/api'
import { errorText } from '@/lib/errors'
import { formatPrice } from '@/lib/format'
import { CATEGORIES, SIZES, type Category, type LangId, type Product, type Size } from '@/types'

const LANGS: LangId[] = ['az', 'ru', 'en']

interface Draft { name: string; slug: string; category: Category; price: string; bestSeller: boolean; active: boolean; description: Record<LangId, string>; stock: Partial<Record<Size, string>> }

const blank = (): Draft => ({ name: '', slug: '', category: CATEGORIES[0], price: '', bestSeller: false, active: true, description: { az: '', ru: '', en: '' }, stock: { S: '0', M: '0', L: '0', XL: '0' } })
const toDraft = (p: Product): Draft => ({
  name: p.name, slug: p.slug, category: p.category, price: String(p.price), bestSeller: Boolean(p.bestSeller), active: p.active,
  description: { az: p.description.az ?? '', ru: p.description.ru ?? '', en: p.description.en ?? '' },
  stock: Object.fromEntries(Object.entries(p.stock).map(([s, q]) => [s, String(q)])),
})
const payload = (d: Draft) => ({
  name: d.name, slug: d.slug || undefined, category: d.category, price: Number(d.price), bestSeller: d.bestSeller, active: d.active, description: d.description,
  stock: Object.fromEntries(Object.entries(d.stock).map(([s, q]) => [s, Number(q)])),
})
const inputCls = 'field !py-2.5'

/** Admin → Products: list, create/edit (texts in 3 languages, sizes + stock, photos), deactivate/delete. */
export function ProductsTab() {
  const { t } = useI18n()
  const { applyCatalog } = useCatalog()
  const [products, setProducts] = useState<Product[] | null>(null)
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try { setProducts((await api<{ products: Product[] }>('/api/admin/products')).products) } catch (e) { setError(errorText(t, e)) }
  }, [t])
  useEffect(() => { void load() }, [load])

  /** After any change: refresh the admin list and the public catalogue shown on the site. */
  const sync = async () => {
    await load()
    try { applyCatalog(await api('/api/products')) } catch { /* the next page load picks it up */ }
  }

  if (editing) return <ProductForm product={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={async (p) => { await sync(); setEditing(p ?? null) }} />

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted">{t('ad.products.hint')}</p>
        <Button variant="accent" className="shrink-0 !px-5 !py-2.5" onClick={() => setEditing('new')}>{t('ad.products.new')}</Button>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
      {products === null && <p className="mt-6 text-muted">{t('acc.loading')}</p>}
      <ul className="mt-6 grid gap-3">
        {products?.map((p) => {
          const total = Object.values(p.stock).reduce((a, b) => a + (b ?? 0), 0)
          return (
            <li key={p.id}>
              <button onClick={() => setEditing(p)} className="grid w-full grid-cols-[4rem_1fr_auto] items-center gap-4 border border-line bg-card p-3 text-left transition-colors hover:border-violet">
                <span className="block w-16 overflow-hidden bg-bg">{p.images[0] && <Img image={p.images[0]} ratio="aspect-[5/6]" sizes="64px" />}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm">{p.name}</span>
                  <span className="block text-xs text-muted">{t(`cat.${p.category}` as Key)} · {formatPrice(p.price)} · {t('ad.stock')}: <span className={total === 0 ? 'text-danger' : ''}>{total}</span></span>
                </span>
                <span className={`border px-2 py-1 text-[0.65rem] uppercase tracking-widest ${p.active ? 'border-emerald-400/40 text-emerald-300' : 'border-line text-muted'}`}>{t(p.active ? 'ad.products.active' : 'ad.products.hidden')}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ProductForm({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: (p?: Product) => Promise<void> }) {
  const { t } = useI18n()
  const [d, setD] = useState<Draft>(product ? toDraft(product) : blank())
  const [cur, setCur] = useState<Product | null>(product)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState<string | null>(null)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((s) => ({ ...s, [k]: v }))

  const run = async (fn: () => Promise<Product | void>, ok?: Key) => {
    setBusy(true); setError(null); setFields({}); setNotice(null)
    try { const p = await fn(); if (p) setCur(p); if (ok) setNotice(t(ok)); return true } catch (e) {
      setError(errorText(t, e)); if (e instanceof ApiError && e.data.fields) setFields(e.data.fields as Record<string, string>)
      return false
    } finally { setBusy(false) }
  }

  const save = () => run(async () => {
    const r = await api<{ product: Product }>(cur ? `/api/admin/products/${cur.id}` : '/api/admin/products', { method: cur ? 'PATCH' : 'POST', body: payload(d) })
    await onSaved(r.product)
    return r.product
  }, 'ad.saved')

  const upload = (files: FileList | null) => {
    if (!files?.length || !cur) return
    void run(async () => {
      let last: Product | undefined
      for (const f of Array.from(files)) { const fd = new FormData(); fd.append('file', f); last = (await api<{ product: Product }>(`/api/admin/products/${cur.id}/images`, { method: 'POST', body: fd })).product }
      await onSaved(last)
      return last
    })
  }
  const img = async (id: number, body: { alt?: string; move?: string }) => {
    if (!cur) return
    const ok = await run(async () => (await api<{ product: Product }>(`/api/admin/products/${cur.id}/images/${id}`, { method: 'PATCH', body })).product)
    if (ok) await onSaved()
  }
  const delImg = (id: number) => cur && run(async () => { const p = (await api<{ product: Product }>(`/api/admin/products/${cur.id}/images/${id}`, { method: 'DELETE' })).product; await onSaved(p); return p })
  const remove = async () => {
    if (!cur || !window.confirm(t('ad.products.confirmDelete'))) return
    const ok = await run(async () => { await api(`/api/admin/products/${cur.id}`, { method: 'DELETE' }) })
    if (ok) { await onSaved(); onClose() }
  }

  const err = (k: string) => (fields[k] ? t('err.invalid_input') : undefined)

  return (
    <div className="max-w-4xl">
      <button onClick={onClose} className="mb-6 text-xs uppercase tracking-[0.2em] text-muted hover:text-fg">← {t('ad.products.back')}</button>
      <h2 className="font-display text-3xl">{cur ? cur.name : t('ad.products.new')}</h2>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Field id="pf-name" label={t('ad.products.name')} error={err('name')}><input id="pf-name" className={inputCls} value={d.name} onChange={(e) => set('name', e.target.value)} maxLength={80} /></Field>
        <Field id="pf-slug" label={t('ad.products.slug')} hint={t('ad.products.slugHint')} error={err('slug')}><input id="pf-slug" className={inputCls} value={d.slug} onChange={(e) => set('slug', e.target.value)} maxLength={60} /></Field>
        <Field id="pf-cat" label={t('ad.products.category')}>
          <select id="pf-cat" className={inputCls} value={d.category} onChange={(e) => set('category', e.target.value as Category)}>{CATEGORIES.map((c) => <option key={c} value={c}>{t(`cat.${c}` as Key)}</option>)}</select>
        </Field>
        <Field id="pf-price" label={t('ad.price')} error={err('price')}><input id="pf-price" type="number" min={0} step="0.01" className={inputCls} value={d.price} onChange={(e) => set('price', e.target.value)} /></Field>
      </div>

      <div className="mt-5 flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={d.active} onChange={(e) => set('active', e.target.checked)} /> {t('ad.products.activeLabel')}</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={d.bestSeller} onChange={(e) => set('bestSeller', e.target.checked)} /> {t('ad.products.best')}</label>
      </div>

      <fieldset className="mt-8">
        <legend className="mb-3 text-xs uppercase tracking-[0.2em] text-accent">{t('ad.stock')}</legend>
        <p className="mb-3 text-xs text-muted">{t('ad.products.stockHint')}</p>
        <div className="flex flex-wrap gap-3">
          {SIZES.map((s) => {
            const on = d.stock[s] !== undefined
            return (
              <div key={s} className="w-24">
                <label className="mb-1 flex items-center gap-1.5 text-xs text-muted"><input type="checkbox" checked={on} onChange={(e) => setD((x) => { const st = { ...x.stock }; if (e.target.checked) st[s] = '0'; else delete st[s]; return { ...x, stock: st } })} /> {s}</label>
                <input aria-label={`${t('ad.stock')} ${s}`} type="number" min={0} step={1} disabled={!on} className={`${inputCls} disabled:opacity-30`} value={d.stock[s] ?? ''} onChange={(e) => setD((x) => ({ ...x, stock: { ...x.stock, [s]: e.target.value } }))} />
              </div>
            )
          })}
        </div>
        {fields.stock && <p role="alert" className="mt-2 text-xs text-danger">{t('err.invalid_input')}</p>}
      </fieldset>

      <div className="mt-8 grid gap-5">
        {LANGS.map((l) => (
          <Field key={l} id={`pf-desc-${l}`} label={`${t('ad.products.desc')} · ${l.toUpperCase()}`}>
            <textarea id={`pf-desc-${l}`} rows={3} maxLength={2000} className="field" value={d.description[l]} onChange={(e) => set('description', { ...d.description, [l]: e.target.value })} />
          </Field>
        ))}
      </div>

      {error && <p role="alert" className="mt-6 text-sm text-danger">{error}</p>}
      {notice && <p role="status" className="mt-6 text-sm text-emerald-300">✓ {notice}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button variant="accent" disabled={busy} onClick={() => void save()}>{t(cur ? 'ad.save' : 'ad.products.create')}</Button>
        {cur && <button onClick={() => void remove()} disabled={busy} className="text-xs uppercase tracking-widest text-danger underline-offset-4 hover:underline">{t('ad.products.delete')}</button>}
      </div>

      <section className="mt-12 border-t border-line pt-8">
        <h3 className="text-xs uppercase tracking-[0.2em] text-accent">{t('ad.products.photos')}</h3>
        {!cur ? <p className="mt-3 text-sm text-muted">{t('ad.products.photosAfter')}</p> : (
          <>
            <p className="mt-2 text-xs text-muted">{t('ad.products.photosHint')}</p>
            <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {cur.images.map((im, i) => (
                <li key={im.id ?? i} className="border border-line bg-card p-2">
                  <div className="overflow-hidden bg-bg"><Img image={im} ratio="aspect-[5/6]" sizes="200px" /></div>
                  <p className="mt-2 text-[0.65rem] uppercase tracking-widest text-muted">{i === 0 ? t('ad.products.photoFront') : i === 1 ? t('ad.products.photoBack') : `#${i + 1}`}</p>
                  {im.id !== undefined && (
                    <>
                      <input aria-label="alt" defaultValue={im.alt} maxLength={200} placeholder={t('ad.products.alt')} className="field mt-1 !py-1.5 text-xs" onBlur={(e) => { if (e.target.value !== im.alt) void img(im.id!, { alt: e.target.value }) }} />
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                        <button disabled={i === 0 || busy} onClick={() => void img(im.id!, { move: 'up' })} aria-label={t('ad.products.moveUp')} className="text-muted hover:text-fg disabled:opacity-30">←</button>
                        <button disabled={i === cur.images.length - 1 || busy} onClick={() => void img(im.id!, { move: 'down' })} aria-label={t('ad.products.moveDown')} className="text-muted hover:text-fg disabled:opacity-30">→</button>
                        <button disabled={busy} onClick={() => void delImg(im.id!)} className="ml-auto text-danger hover:underline">{t('ad.products.removePhoto')}</button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
            <label className="mt-5 inline-block cursor-pointer border border-line px-4 py-2.5 text-xs uppercase tracking-[0.2em] transition-colors hover:border-violet hover:bg-violet/25">
              {t('ad.products.upload')}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={(e) => { upload(e.target.files); e.target.value = '' }} />
            </label>
          </>
        )}
      </section>
    </div>
  )
}
