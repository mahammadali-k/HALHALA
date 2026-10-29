'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { useCatalog } from '@/context/CatalogContext'
import { useI18n, type Key } from '@/i18n'
import { api, ApiError } from '@/lib/api'
import { errorText } from '@/lib/errors'
import { POLICY_KINDS, type StoreSettings } from '@/types/api'
import type { LangId } from '@/types'

const LANGS: LangId[] = ['az', 'ru', 'en']

/** Admin → Settings: contact details, social links, delivery pricing, legal/policy texts and the database backup. */
export function SettingsTab() {
  const { t } = useI18n()
  const { applyStore } = useCatalog()
  const [s, setS] = useState<StoreSettings | null>(null)
  const [free, setFree] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api<{ store: StoreSettings }>('/api/admin/settings').then((r) => { setS(r.store); setFree(r.store.freeDeliveryFrom === null ? '' : String(r.store.freeDeliveryFrom)) }).catch((e) => setError(errorText(t, e)))
  }, [t])
  if (!s) return <p className="text-muted">{error ?? t('acc.loading')}</p>

  const set = <K extends keyof StoreSettings>(k: K, v: StoreSettings[K]) => { setSaved(false); setS((x) => x && { ...x, [k]: v }) }
  const text = (k: 'email' | 'phone' | 'address' | 'instagramHandle' | 'tiktokUrl' | 'est', label: Key, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <Field id={`st-${k}`} label={t(label)} error={fields[k] ? t('err.invalid_input') : undefined}>
      <input id={`st-${k}`} className="field !py-2.5" value={s[k]} onChange={(e) => set(k, e.target.value)} {...props} />
    </Field>
  )

  const save = async () => {
    setBusy(true); setError(null); setFields({}); setSaved(false)
    try {
      const r = await api<{ store: StoreSettings }>('/api/admin/settings', { method: 'PATCH', body: { ...s, deliveryFee: Number(s.deliveryFee), freeDeliveryFrom: free.trim() === '' ? null : Number(free) } })
      setS(r.store); applyStore(r.store); setSaved(true)
    } catch (e) {
      setError(errorText(t, e)); if (e instanceof ApiError && e.data.fields) setFields(e.data.fields as Record<string, string>)
    } finally { setBusy(false) }
  }

  return (
    <div className="max-w-4xl space-y-10">
      <section>
        <h2 className="mb-4 text-xs uppercase tracking-[0.25em] text-accent">{t('ad.settings.contact')}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {text('email', 'ad.settings.email', { type: 'email', maxLength: 254 })}
          {text('phone', 'ad.settings.phone', { type: 'tel', maxLength: 30 })}
          <div className="sm:col-span-2">{text('address', 'ad.settings.address', { maxLength: 300 })}</div>
          {text('instagramHandle', 'ad.settings.instagram', { maxLength: 30, placeholder: 'halhala.az' })}
          {text('tiktokUrl', 'ad.settings.tiktok', { maxLength: 200, placeholder: 'https://www.tiktok.com/@halhala.az' })}
          {text('est', 'ad.settings.est', { maxLength: 4, inputMode: 'numeric' })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xs uppercase tracking-[0.25em] text-accent">{t('ad.settings.delivery')}</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="st-fee" label={t('ad.settings.fee')} error={fields.deliveryFee ? t('err.invalid_input') : undefined}>
            <input id="st-fee" type="number" min={0} step="0.01" className="field !py-2.5" value={s.deliveryFee} onChange={(e) => set('deliveryFee', e.target.value as unknown as number)} />
          </Field>
          <Field id="st-free" label={t('ad.settings.free')} hint={t('ad.settings.freeHint')}>
            <input id="st-free" type="number" min={0} step="0.01" className="field !py-2.5" value={free} onChange={(e) => { setSaved(false); setFree(e.target.value) }} />
          </Field>
        </div>
      </section>

      <section>
        <h2 className="mb-1 text-xs uppercase tracking-[0.25em] text-accent">{t('ad.settings.policies')}</h2>
        <p className="mb-4 text-xs text-muted">{t('ad.settings.policiesHint')}</p>
        <div className="space-y-6">
          {POLICY_KINDS.map((k) => (
            <div key={k}>
              <h3 className="mb-2 text-sm">{t(`ad.policy.${k}` as Key)}</h3>
              <div className="grid gap-3 lg:grid-cols-3">
                {LANGS.map((l) => (
                  <Field key={l} id={`st-${k}-${l}`} label={l.toUpperCase()}>
                    <textarea id={`st-${k}-${l}`} rows={5} maxLength={20000} className="field" value={s.policies[k][l]}
                      onChange={(e) => set('policies', { ...s.policies, [k]: { ...s.policies[k], [l]: e.target.value } })} />
                  </Field>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {saved && <p role="status" className="text-sm text-emerald-300">✓ {t('ad.saved')}</p>}
      <Button variant="accent" disabled={busy} onClick={() => void save()}>{t('ad.save')}</Button>

      <section className="border-t border-line pt-8">
        <h2 className="mb-2 text-xs uppercase tracking-[0.25em] text-accent">{t('ad.backup.title')}</h2>
        <p className="mb-4 max-w-2xl text-sm text-muted">{t('ad.backup.hint')}</p>
        <a href="/api/admin/backup" download className="inline-block border border-line px-4 py-2.5 text-xs uppercase tracking-[0.2em] transition-colors hover:border-violet hover:bg-violet/25">{t('ad.backup.download')}</a>
      </section>
    </div>
  )
}
