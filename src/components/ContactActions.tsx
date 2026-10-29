import { useState } from 'react'
import { useI18n } from '../i18n'
import { dmChannels, sendVia, type Channel } from '../lib/contact'
import { Button } from './Button'

interface Props {
  /** Pre-written message that is copied to the clipboard when a channel opens. */
  message: string
  variant?: 'primary' | 'outline' | 'accent'
  className?: string
}

/** One button per configured messaging channel. Copies the message, opens the chat, tells the user what to do next. */
export function ContactActions({ message, variant = 'accent', className = '' }: Props) {
  const { t } = useI18n()
  const [status, setStatus] = useState<string | null>(null)
  const go = async (c: Channel) => {
    const r = await sendVia(c, message)
    setStatus(r === 'copied' ? t('ca.copied', { channel: c.label }) : t('ca.manual', { channel: c.label, message }))
  }
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-3">
        {dmChannels.map((c) => <Button key={c.id} variant={variant} onClick={() => go(c)}>{t('ca.button', { channel: c.label })}</Button>)}
      </div>
      <p role="status" className="mt-3 text-sm text-muted">{status}</p>
    </div>
  )
}
