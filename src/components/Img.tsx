import type { ImageAsset } from '../types'

interface Props {
  image: ImageAsset
  /** Tailwind aspect class, e.g. "aspect-[4/5]". */
  ratio?: string
  className?: string
  /** Above-the-fold / LCP image: loaded immediately with high priority. */
  eager?: boolean
  /** Honest `sizes` hint so the browser downloads the smallest adequate file. */
  sizes?: string
}

/** Real image (responsive srcset + blur placeholder + reserved size) or a labelled placeholder when `src` is missing. */
export function Img({ image, ratio = 'aspect-[4/5]', className = '', eager, sizes = '(min-width:1024px) 33vw, 50vw' }: Props) {
  return (
    <div
      className={`relative w-full overflow-hidden bg-ink-2 ${ratio} ${className}`}
      style={image.blur ? { backgroundImage: `url(${image.blur})`, backgroundSize: 'cover' } : undefined}
    >
      {image.src ? (
        <img
          src={image.src}
          srcSet={image.srcSet}
          sizes={image.srcSet ? sizes : undefined}
          width={image.width}
          height={image.height}
          alt={image.alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={eager ? 'high' : 'auto'}
          style={{ objectPosition: image.pos }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div
          role="img"
          aria-label={image.alt}
          className="absolute inset-0 flex items-end bg-[radial-gradient(120%_90%_at_30%_10%,#3a1a2c_0%,#221e24_55%,#1a171c_100%)] p-3"
        >
          <span className="text-[0.6rem] uppercase tracking-[0.2em] text-muted/60">{image.label}</span>
        </div>
      )}
    </div>
  )
}
