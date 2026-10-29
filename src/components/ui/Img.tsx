import Image from 'next/image'
import type { ImageAsset } from '@/types'

interface Props {
  image: ImageAsset
  /** Tailwind aspect/size class, e.g. "aspect-[4/5]" or "h-full". */
  ratio?: string
  className?: string
  /** Above-the-fold / LCP image: preloaded and fetched with high priority. */
  eager?: boolean
  /** Honest `sizes` hint so the browser downloads the smallest adequate file. */
  sizes?: string
}

/**
 * Photo (next/image → responsive srcset from the pre-optimised WebP set, blur-up placeholder, reserved space)
 * or a labelled placeholder when the slot has no photo yet.
 */
export function Img({ image, ratio = 'aspect-[4/5]', className = '', eager, sizes = '(min-width:1024px) 33vw, 50vw' }: Props) {
  return (
    <div className={`relative w-full overflow-hidden bg-ink-2 ${ratio} ${className}`}>
      {image.src ? (
        <Image
          src={image.src} alt={image.alt} fill sizes={sizes} priority={eager}
          placeholder={image.blur ? 'blur' : 'empty'} blurDataURL={image.blur}
          style={{ objectPosition: image.pos }} className="object-cover"
        />
      ) : (
        <div role="img" aria-label={image.alt} className="absolute inset-0 flex items-end bg-[radial-gradient(120%_90%_at_30%_10%,#2a1650_0%,#100b18_55%,#09070d_100%)] p-3">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-muted/60">{image.label}</span>
        </div>
      )}
    </div>
  )
}
