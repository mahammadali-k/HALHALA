const WIDTHS = [480, 800, 1200, 1600] as const

/**
 * next/image loader for the pre-generated photo set: `/images/<name>` + a requested width →
 * `/images/<name>-<bucket>.webp` where bucket is the smallest generated width that is >= the request.
 */
export default function imageLoader({ src, width }: { src: string; width: number }) {
  const bucket = WIDTHS.find((w) => w >= width) ?? WIDTHS[WIDTHS.length - 1]
  return `${src}-${bucket}.webp`
}
