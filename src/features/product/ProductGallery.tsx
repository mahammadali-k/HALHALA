'use client'
import { AnimatePresence, m } from 'motion/react'
import { useState } from 'react'
import { useI18n } from '@/i18n'
import type { ImageAsset } from '@/types'
import { Img } from '@/components/ui/Img'
import { Spin360 } from '@/features/product/Spin360'

interface Props { images: ImageAsset[]; spin?: string[] }

/** Product media: the slow 360° viewer first, then the photos. */
export function ProductGallery({ images, spin }: Props) {
  const { t } = useI18n()
  const [view, setView] = useState<'spin' | number>('spin')
  const tile = (active: boolean) => `block w-14 shrink-0 border transition-colors sm:w-16 md:w-full ${active ? 'border-accent' : 'border-line hover:border-accent-deep'}`
  return (
    <div className="grid gap-3 md:grid-cols-[5rem_1fr]">
      <div className="order-2 flex gap-2 overflow-x-auto pb-1 md:order-1 md:flex-col md:overflow-visible md:pb-0" role="group" aria-label={t('p.images')}>
        <button onClick={() => setView('spin')} aria-pressed={view === 'spin'} aria-label={t('p.spin')}
          className={`${tile(view === 'spin')} relative flex aspect-[4/5] items-center justify-center bg-ink-2 font-mono text-xs tracking-[0.15em] text-accent`}>360°</button>
        {images.map((img, idx) => (
          <button key={idx} onClick={() => setView(idx)} aria-pressed={view === idx} aria-label={t('p.image', { i: idx + 1, n: images.length })} className={tile(view === idx)}>
            <Img image={img} sizes="80px" />
          </button>
        ))}
      </div>
      <div className="relative order-1 md:order-2">
        {view === 'spin' ? (
          <Spin360 front={images[0]} back={images[1]} frames={spin} />
        ) : (
          <AnimatePresence mode="wait">
            <m.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="chamfer-frame">
              <div className="chamfer-in"><Img image={images[view]} ratio="aspect-[4/5]" eager sizes="(min-width:768px) 50vw, 100vw" /></div>
            </m.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
