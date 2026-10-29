import { site } from '@/data/site'
import type { TFn } from '@/i18n'

export type ChannelId = 'instagram' | 'tiktok'
export interface Channel { id: ChannelId; label: string; url: string }

/** Messaging channels that are actually configured (TikTok appears only while its URL is set in data/site.ts). */
export const dmChannels: Channel[] = [
  { id: 'instagram', label: 'Instagram', url: site.dmUrl },
  ...(site.tiktokUrl ? [{ id: 'tiktok' as const, label: 'TikTok', url: site.tiktokUrl }] : []),
]

/**
 * Neither platform lets a website pre-fill a DM, so: copy the prepared message to the clipboard
 * and open the chat. The user pastes and sends. Must be called from a click handler.
 */
export async function sendVia(channel: Channel, message: string): Promise<'copied' | 'manual'> {
  window.open(channel.url, '_blank', 'noopener,noreferrer')
  try {
    await navigator.clipboard.writeText(message)
    return 'copied'
  } catch {
    return 'manual'
  }
}

export const productInquiry = (t: TFn, name: string, size?: string | null) =>
  t('msg.inquiry', { name, size: size ? t('msg.size', { size }) : '' })

export const openChat = () => window.dispatchEvent(new Event('halhala:open-chat'))
export const onOpenChat = (fn: () => void) => {
  window.addEventListener('halhala:open-chat', fn)
  return () => window.removeEventListener('halhala:open-chat', fn)
}
