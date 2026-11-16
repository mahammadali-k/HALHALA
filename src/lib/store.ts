import type { LangId } from '@/types'
import type { PolicyKind, StoreSettings } from '@/types/api'

/** Pure helpers over the editable store settings (usable on the server and in the browser). */
export const instagramUrl = (s: StoreSettings) => `https://www.instagram.com/${s.instagramHandle}/`
export const instagramDm = (s: StoreSettings) => `https://ig.me/m/${s.instagramHandle}`

export const whatsappUrl = (s: StoreSettings) => `https://wa.me/${s.whatsapp}`

export interface Channel { id: 'whatsapp' | 'instagram' | 'tiktok'; label: string; url: string }
/** Messaging channels that are configured (WhatsApp / TikTok only while set). WhatsApp comes first: it is the only one that pre-fills the message. */
export const channelsOf = (s: StoreSettings): Channel[] => [
  ...(s.whatsapp ? [{ id: 'whatsapp' as const, label: 'WhatsApp', url: whatsappUrl(s) }] : []),
  { id: 'instagram', label: 'Instagram', url: instagramDm(s) },
  ...(s.tiktokUrl ? [{ id: 'tiktok' as const, label: 'TikTok', url: s.tiktokUrl }] : []),
]

const ORDER: LangId[] = ['en', 'az', 'ru']
/** First non-empty text: the requested language, then the others. '' when nothing is published. */
export const pickText = (texts: Partial<Record<LangId, string>>, lang: LangId) =>
  [lang, ...ORDER].map((l) => texts[l]?.trim()).find(Boolean) ?? ''
export const policyText = (s: StoreSettings, kind: PolicyKind, lang: LangId) => pickText(s.policies[kind], lang)
