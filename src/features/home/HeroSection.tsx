'use client'
import { m } from 'motion/react'
import { ButtonLink } from '@/components/ui/Button'
import { Img } from '@/components/ui/Img'
import { Wordmark } from '@/components/layout/Wordmark'
import { images } from '@/data/images'
import { useI18n } from '@/i18n'

/**
 * Hero (brand book): the two model photos side by side — the only photos up here — the official HALHALA logo dead
 * centre, the motto under it, all text white over a black → purple wash. The products start right below the fold.
 * The logo comes from `images.logo` (public/brand/logo.*); until that file is provided the text wordmark stands in.
 */
export function HeroSection() {
  const { t } = useI18n()
  const logo = images.logo
  return (
    <section className="relative isolate overflow-hidden bg-ink">
      <h1 className="sr-only">HALHALA — {t('hero.motto')}</h1>

      <div className="grid h-[calc(100svh-6.5rem)] max-h-[60rem] min-h-[32rem] grid-cols-2 gap-px bg-line sm:h-[calc(100svh-3.75rem)]">
        {images.heroPair.map((photo) => (
          <div key={photo.label} className="relative overflow-hidden">
            <Img image={photo} ratio="absolute inset-0 h-full" eager sizes="50vw" />
          </div>
        ))}
      </div>

      {/* wash: purple at the top, deep black towards the products so the page flows into them */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_50%_at_50%_46%,rgb(7_5_11/0.6),transparent_72%),linear-gradient(to_bottom,rgb(109_63_224/0.3),rgb(7_5_11/0)_38%,rgb(7_5_11/0.55)_72%,rgb(7_5_11)_100%)]" />

      {/* logo: exactly centred on both axes */}
      <m.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute inset-0 grid place-items-center">
        {logo.src
          ? <img src={logo.src} alt="HALHALA" className="h-auto w-[min(68vw,38rem)] select-none drop-shadow-[0_8px_40px_rgb(0_0_0/0.6)]" />
          : <Wordmark className="!text-[clamp(3.6rem,17vw,10.5rem)] drop-shadow-[0_8px_40px_rgb(0_0_0/0.6)]" />}
      </m.div>

      <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
        className="absolute inset-x-0 bottom-9 flex flex-col items-center gap-6 px-5 text-center sm:bottom-14">
        <p className="text-[clamp(1.15rem,3.4vw,2rem)] font-light text-fg drop-shadow-[0_2px_16px_rgb(0_0_0/0.7)]">{t('hero.motto')}</p>
        <ButtonLink href="#cat-t-shirts" className="!px-9 !py-4">{t('hero.shop')}</ButtonLink>
      </m.div>
    </section>
  )
}
