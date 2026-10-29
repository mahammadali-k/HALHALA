import { AnimatePresence, m } from 'motion/react'
import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import { useCart } from '../context/CartContext'
import { CheckIcon } from './icons'

/** Brief, non-blocking confirmation after add-to-cart (announced to screen readers). */
export function AddedToast() {
  const { lastAdded, open } = useCart()
  const { t } = useI18n()
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (!lastAdded) return
    setShown(true)
    const t = setTimeout(() => setShown(false), 3200)
    return () => clearTimeout(t)
  }, [lastAdded])
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
      <AnimatePresence>
        {shown && lastAdded && (
          <m.div
            key={lastAdded.n}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="pointer-events-auto flex items-center gap-4 border border-accent bg-ink-2 px-5 py-3 text-sm shadow-xl"
          >
            <span className="text-accent"><CheckIcon /></span>
            <span>{t('toast.added', { name: lastAdded.name, size: lastAdded.size })}</span>
            <button onClick={() => { setShown(false); open() }} className="text-xs uppercase tracking-widest text-accent underline-offset-4 hover:underline">{t('toast.view')}</button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}
