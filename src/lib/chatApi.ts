import type { Lang } from '@/i18n'
import { instagramUrl, policyText } from '@/lib/store'
import type { StoreSettings } from '@/types/api'
import type { Product } from '@/types'
import { describe, sizesOf, stockFor } from '@/lib/catalog'

export interface ApiMessage { role: 'user' | 'assistant'; content: string }

/** Everything the AI is allowed to know — built from the same data the shop renders. */
export function buildContext(lang: Lang, cart: { count: number; total: number }, products: Product[], payments: string[], store: StoreSettings) {
  return {
    catalogue: products.map((p) => {
      const sizes = sizesOf(p)
      return {
        name: p.name, url: `/product/${p.slug}`, priceAZN: p.price, category: p.category, description: describe(p, lang), bestSeller: Boolean(p.bestSeller),
        sizesInStock: sizes.filter((s) => stockFor(p, s) > 0), soldOutSizes: sizes.filter((s) => stockFor(p, s) === 0),
      }
    }),
    cart: { items: cart.count, totalAZN: cart.total },
    shop: { online: true, payments },
    brand: {
      instagram: instagramUrl(store), tiktok: store.tiktokUrl, email: store.email, phone: store.phone, address: store.address,
      deliveryPolicy: policyText(store, 'delivery', lang) || null, returnsPolicy: policyText(store, 'returns', lang) || null,
    },
  }
}

/** Is the live AI available on this deployment? (False when the server has no API key or isn't running.) */
export async function aiAvailable(): Promise<boolean> {
  try {
    const r = await fetch('/api/chat/health', { headers: { Accept: 'application/json' } })
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) return false
    return Boolean((await r.json()).ai)
  } catch { return false }
}

/** Streams the assistant reply. Calls onDelta for each text chunk; throws if the request fails before/while streaming. */
export async function streamChat(opts: {
  messages: ApiMessage[]; lang: Lang; context: ReturnType<typeof buildContext>; onDelta: (s: string) => void; signal?: AbortSignal
}): Promise<void> {
  const r = await fetch('/api/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: opts.signal,
    body: JSON.stringify({ messages: opts.messages, lang: opts.lang, context: opts.context }),
  })
  if (!r.ok || !r.body) throw new Error(`chat ${r.status}`)
  const reader = r.body.getReader()
  const dec = new TextDecoder()
  let buf = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    let i: number
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const line = buf.slice(0, i).trim()
      buf = buf.slice(i + 2)
      if (!line.startsWith('data:')) continue
      const ev = JSON.parse(line.slice(5)) as { t?: string; done?: boolean; error?: string }
      if (ev.error) throw new Error(ev.error)
      if (ev.t) opts.onDelta(ev.t)
    }
  }
}

const TOKEN = /\[\[(link:([^|\]]+)\|([^\]]+)|handoff)\]\]/g
const SAFE_PATH = /^\/(shop|cart|checkout|info|contact|about|collection|product\/[\w-]+)?([?#][\w=&%-]*)?$/

/** Splits the model's text from its [[link:…]] / [[handoff]] action tokens (also hides a still-streaming partial token). */
export function parseActions(raw: string): { text: string; actions: { label: string; href?: string; handoff?: boolean }[] } {
  const actions: { label: string; href?: string; handoff?: boolean }[] = []
  const text = raw.replace(TOKEN, (_m, kind: string, to?: string, label?: string) => {
    if (kind === 'handoff') actions.push({ label: '', handoff: true })
    else if (to && label && SAFE_PATH.test(to.trim()) && actions.filter((a) => a.href).length < 3) actions.push({ label: label.trim(), href: to.trim() })
    return ''
  }).replace(/\[\[[^\]]*$/, '').trim()
  return { text, actions }
}
