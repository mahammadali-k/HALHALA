import type { LangId } from '@/types'
import type { PolicyKind, StoreSettings } from '@/types/api'

/** Pure helpers over the editable store settings (usable on the server and in the browser). */
export const instagramUrl = (s: StoreSettings) => `https://www.instagram.com/${s.instagramHandle}/`
export const instagramDm = (s: StoreSettings) => `https://ig.me/m/${s.instagramHandle}`

export interface Channel { id: 'instagram' | 'tiktok'; label: string; url: string }
/** Messaging channels that are configured (TikTok only while a URL is set). */
export const channelsOf = (s: StoreSettings): Channel[] => [
  { id: 'instagram', label: 'Instagram', url: instagramDm(s) },
  ...(s.tiktokUrl ? [{ id: 'tiktok' as const, label: 'TikTok', url: s.tiktokUrl }] : []),
]

const ORDER: LangId[] = ['en', 'az', 'ru']
/** First non-empty text: the requested language, then the others. '' when nothing is published. */
export const pickText = (texts: Partial<Record<LangId, string>>, lang: LangId) =>
  [lang, ...ORDER].map((l) => texts[l]?.trim()).find(Boolean) ?? ''
export const policyText = (s: StoreSettings, kind: PolicyKind, lang: LangId) => pickText(s.policies[kind], lang)
