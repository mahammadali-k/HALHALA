import { AnimatePresence, m } from 'motion/react'
import { useState } from 'react'
import { useI18n } from '../i18n'
import type { ImageAsset } from '../types'
import { Img } from './Img'

export function ProductGallery({ images }: { images: ImageAsset[] }) {
  const { t } = useI18n()
  const [i, setI] = useState(0)
  return (
    <div className="grid gap-3 md:grid-cols-[5rem_1fr]">
      <div className="order-2 flex gap-2 md:order-1 md:flex-col" role="group" aria-label={t('p.images')}>
        {images.map((img, idx) => (
          <button
            key={idx} onClick={() => setI(idx)} aria-label={t('p.image', { i: idx + 1, n: images.length })} aria-pressed={i === idx}
            className={`w-16 border transition-colors md:w-full ${i === idx ? 'border-gold' : 'border-line hover:border-muted'}`}
          >
            <Img image={img} />
          </button>
        ))}
      </div>
      <div className="relative order-1 md:order-2">
        <AnimatePresence mode="wait">
          <m.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <Img image={images[i]} ratio="aspect-[4/5]" eager sizes="(min-width:768px) 50vw, 100vw" />
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
