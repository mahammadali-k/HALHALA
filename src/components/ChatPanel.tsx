import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useCatalog } from '../context/CatalogContext'
import { useI18n, type Key } from '../i18n'
import { api, type Order } from '../lib/api'
import { formatPrice } from '../lib/format'
import { handoffMessage, quickReplies, reply, type BotAction } from '../lib/assistant'
import { aiAvailable, buildContext, parseActions, streamChat, type ApiMessage } from '../lib/chatApi'
import { ContactActions } from './ContactActions'
import { CloseIcon } from './icons'

interface Msg { id: number; from: 'bot' | 'user'; text: string; actions?: BotAction[] }
const KEY = 'halhala.chat.v2'

const load = (): Msg[] => {
  try { const v = JSON.parse(sessionStorage.getItem(KEY) ?? 'null'); return Array.isArray(v) ? v : [] } catch { return [] }
}

export default function ChatPanel({ onClose }: { onClose: () => void }) {
  const { count, total } = useCart()
  const { t, lang } = useI18n()
  const { user } = useAuth()
  const { backend, config } = useCatalog()
  const shop = { online: backend === 'on', payments: config?.payments ?? [] }
  const [msgs, setMsgs] = useState<Msg[]>(load)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [ai, setAi] = useState<boolean | null>(null)
  const end = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const abort = useRef<AbortController | null>(null)
  const nextId = useRef(msgs.reduce((m, x) => Math.max(m, x.id), 0) + 1)

  useEffect(() => { void aiAvailable().then(setAi) }, [])
  useEffect(() => { try { sessionStorage.setItem(KEY, JSON.stringify(msgs.slice(-40))) } catch { /* ignore */ } }, [msgs])
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [msgs])
  useEffect(() => { input.current?.focus() }, [])
  useEffect(() => () => abort.current?.abort(), [])
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [onClose])

  const push = (m: Omit<Msg, 'id'>) => { const id = nextId.current++; setMsgs((x) => [...x, { ...m, id }]); return id }
  const patch = (id: number, p: Partial<Msg>) => setMsgs((x) => x.map((m) => (m.id === id ? { ...m, ...p } : m)))

  const offline = (q: string) => { const r = reply(q, { count, total, ...shop }, lang); push({ from: 'bot', text: r.text, actions: r.actions }) }

  /** Order status is answered by the website itself (never by the AI): number + the phone used, or the logged-in account. */
  const trackOrder = async (text: string): Promise<boolean> => {
    const number = text.match(/HH-\d{6}-[A-Z0-9]{4}/i)?.[0].toUpperCase()
    if (!number || !shop.online) return false
    const phone = text.replace(number, '').match(/\+?\d[\d\s()-]{6,}\d/)?.[0]
    const line = (o: { number: string; status: string; paymentStatus: string; total: number }) =>
      t('chat.track.found', { number: o.number, status: t(`st.${o.status}` as Key), payment: t(`ps.${o.paymentStatus}` as Key), total: formatPrice(o.total) })
    try {
      if (user) {
        const mine = (await api<{ orders: Order[] }>('/api/orders/mine')).orders.find((o) => o.number === number)
        if (mine) { push({ from: 'bot', text: line(mine), actions: [{ label: t('acc.title'), to: '/account' }] }); return true }
      }
      if (!phone) { push({ from: 'bot', text: t('chat.track.ask') }); return true }
      const r = await api<{ order: { number: string; status: string; paymentStatus: string; total: number } }>('/api/orders/track', { method: 'POST', body: { number, phone } })
      push({ from: 'bot', text: line(r.order) })
    } catch { push({ from: 'bot', text: t('chat.track.none') }) }
    return true
  }

  const ask = async (q: string) => {
    const clean = q.trim()
    if (!clean || busy) return
    const history: ApiMessage[] = [...msgs.map((m) => ({ role: m.from === 'user' ? 'user' as const : 'assistant' as const, content: m.text })), { role: 'user', content: clean }]
    push({ from: 'user', text: clean })
    setText('')
    if (/HH-\d{6}-[A-Z0-9]{4}/i.test(clean) && shop.online) { setBusy(true); await trackOrder(clean); setBusy(false); return }
    if (!ai) { setBusy(true); window.setTimeout(() => { offline(clean); setBusy(false) }, 350); return }

    setBusy(true)
    const id = push({ from: 'bot', text: '' })
    let raw = ''
    abort.current = new AbortController()
    try {
      await streamChat({
        messages: history, lang, context: buildContext(lang, { count, total }, shop), signal: abort.current.signal,
        onDelta: (d) => { raw += d; patch(id, { text: parseActions(raw).text }) },
      })
      const { text: finalText, actions } = parseActions(raw)
      patch(id, { text: finalText || t('chat.error'), actions })
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      if (!raw) { setMsgs((x) => x.filter((m) => m.id !== id)); offline(clean) } // server hiccup: answer from the built-in assistant
      else patch(id, { text: `${parseActions(raw).text}\n\n${t('chat.error')}` })
    } finally { setBusy(false) }
  }
  const submit = (e: FormEvent) => { e.preventDefault(); void ask(text) }
  const userLines = msgs.filter((m) => m.from === 'user').map((m) => m.text)
  const shown: Msg[] = [{ id: 0, from: 'bot', text: t('chat.greet') }, ...msgs]

  return (
    <section role="dialog" aria-label={t('chat.title')} className="fixed inset-x-3 bottom-20 z-50 flex max-h-[min(36rem,calc(100svh-7rem))] flex-col border border-line bg-ink-2 shadow-2xl shadow-black/50 sm:inset-x-auto sm:right-5 sm:w-[24rem]">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <p className="text-sm">{t('chat.title')}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${ai ? 'bg-emerald-400' : 'bg-muted/60'}`} />
            {ai === null ? '…' : ai ? t('chat.mode.ai') : t('chat.mode.basic')}
          </p>
        </div>
        <button onClick={onClose} aria-label={t('chat.close')} className="p-1 text-muted hover:text-fg"><CloseIcon /></button>
      </header>

      <div role="log" aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {shown.map((m) => (
          <div key={m.id} className={m.from === 'user' ? 'flex justify-end' : ''}>
            <div className={`max-w-[88%] whitespace-pre-line px-3.5 py-2.5 text-sm leading-relaxed ${m.from === 'user' ? 'bg-burgundy text-fg' : 'bg-card text-fg'}`}>
              {m.text || <span className="text-muted" aria-label={t('chat.typing')}>…</span>}
              {m.actions && m.actions.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {m.actions.map((a, i) => a.handoff
                    ? <ContactActions key={`h${i}`} message={handoffMessage(userLines, lang)} variant="gold" />
                    : a.to
                      ? <Link key={a.to + i} to={a.to} onClick={onClose} className="border border-line px-3 py-2 text-xs uppercase tracking-widest transition-colors hover:border-gold-deep hover:text-gold-deep">{a.label}</Link>
                      : null)}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
        {quickReplies(lang).map((q) => (
          <button key={q} onClick={() => void ask(q)} disabled={busy} className="border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:border-gold-deep hover:text-gold-deep disabled:opacity-50">{q}</button>
        ))}
      </div>
      <form onSubmit={submit} className="flex border-t border-line">
        <label htmlFor="chat-input" className="sr-only">{t('chat.your')}</label>
        <input id="chat-input" ref={input} value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder={t('chat.placeholder')} autoComplete="off" className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted/60 focus-visible:bg-card" />
        <button type="submit" disabled={!text.trim() || busy} className="px-4 text-xs uppercase tracking-widest text-gold transition-colors hover:text-fg disabled:opacity-40">{t('chat.send')}</button>
      </form>
    </section>
  )
}
