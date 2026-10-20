import { images } from '../data/images'

/** Text wordmark placeholder. Swap for the official logo by setting images.logo.src. */
export function Wordmark({ className = '' }: { className?: string }) {
  return images.logo.src
    ? <img src={images.logo.src} alt="HALHALA" className={`h-7 w-auto ${className}`} />
    : <span className={`font-display text-2xl font-semibold tracking-[0.32em] ${className}`}>HALHALA</span>
}
