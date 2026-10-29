import type { ImageAsset } from '@/types'
import { photoMeta, type PhotoName } from '@/data/photos.generated'

/** Build an ImageAsset from an optimised photo (files live in /public/images, see scripts/optimize-images.mjs). */
export const photo = (name: PhotoName, alt: string, pos = 'center 30%'): ImageAsset => {
  const m = photoMeta[name]
  return { src: `/images/${name}`, width: m.width, height: m.height, blur: m.blur, pos, alt, label: name }
}

/**
 * Central image registry. Slots without a photo render a labelled placeholder.
 * The logo slot is for the OFFICIAL HALHALA logo file; until provided the header uses a plain text wordmark.
 */
export const images = {
  logo: { alt: 'HALHALA', label: 'LOGO' } as ImageAsset,
  /** Optional transparent cut-out for the hero (e.g. goat on the car). Provide a photo() via `npm run images` and it replaces the framed photo. */
  heroArt: undefined as ImageAsset | undefined,
  hero: photo('laundry-side', 'Model in the HALHALA goat tee, standing in a courtyard with laundry lines', 'center 28%'),
  heroSecondary: photo('carpet-blur', 'HALHALA goat tee in front of a red carpet, motion-blurred portrait', 'center 55%'),
  story: photo('carpet-motion', 'Model with eyes closed in motion blur in front of a red carpet', 'center 30%'),
  about: [
    photo('back-logo', 'Back of the HALHALA tee with the goat-horn logo', 'center 35%'),
    photo('laundry-close', 'Close portrait wearing the goat tee', 'center 35%'),
    photo('bench-zoom', 'Model seated on a bench with a radial zoom effect', 'center 40%'),
  ],
  collections: {
    mountain: photo('bench-glasses', 'Mountain Goat collection — model on a bench with tinted glasses', 'center 25%'),
    essentials: photo('laundry-full', 'Essentials collection — full-length look in black', 'center 40%'),
    limited: photo('wall-glasses-cam', 'Limited collection — sunlit wall portrait', 'center 30%'),
  },
  social: [
    photo('laundry-cam', 'HALHALA lookbook — courtyard portrait'),
    photo('wall-glasses-high', 'HALHALA lookbook — sunlit wall'),
    photo('bench-low', 'HALHALA lookbook — low angle on a bench', 'center 25%'),
    photo('bench-motion', 'HALHALA lookbook — bench in motion blur', 'center 40%'),
    photo('laundry-close', 'HALHALA lookbook — close portrait', 'center 30%'),
    photo('wall-glasses-cam', 'HALHALA lookbook — glasses, looking up', 'center 30%'),
  ],
}

/** Gallery for a product from lookbook photo names. */
export const gallery = (name: string, shots: [PhotoName, string][]): ImageAsset[] =>
  shots.map(([n, label], i) => photo(n, `${name} — ${label}`, i === 1 ? 'center 35%' : 'center 38%'))
