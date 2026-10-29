'use client'
import { AnimatePresence, m } from 'motion/react'
import type { ReactNode } from 'react'
import { useI18n } from '@/i18n'
import { useDialog } from '@/hooks/useDialog'
import { CloseIcon } from '@/components/ui/icons'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  side?: 'left' | 'right'
  children: ReactNode
  footer?: ReactNode
}

export function Drawer({ open, onClose, title, side = 'right', children, footer }: Props) {
  const { t } = useI18n()
  const ref = useDialog(open, onClose)
  const x = side === 'right' ? '100%' : '-100%'
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <m.div
            className="absolute inset-0 bg-black/70"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <m.div
            ref={ref}
            role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
            className={`absolute top-0 flex h-full w-full max-w-md flex-col border-line bg-ink-2 outline-none ${side === 'right' ? 'right-0 border-l' : 'left-0 border-r'}`}
            initial={{ x }} animate={{ x: 0 }} exit={{ x }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-xs font-medium uppercase tracking-[0.25em]">{title}</h2>
              <button onClick={onClose} aria-label={t('drawer.close', { title })} className="p-1 text-muted hover:text-fg"><CloseIcon /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && <div className="border-t border-line px-5 py-4">{footer}</div>}
          </m.div>
        </div>
      )}
    </AnimatePresence>
  )
}
