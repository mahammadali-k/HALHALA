import { images } from '@/data/images'

/**
 * Text wordmark in a gothic display face (stand-in). The OFFICIAL HALHALA logo file, once provided,
 * is used automatically when images.logo.src is set.
 */
export function Wordmark({ className = '' }: { className?: string }) {
  return images.logo.src
    ? <img src={images.logo.src} alt="HALHALA" className={`h-7 w-auto ${className}`} />
    : <span className={`font-brand text-[1.7rem] leading-none tracking-wide ${className}`}>HALHALA</span>
}
