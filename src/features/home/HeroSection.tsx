'use client'
import { m } from 'motion/react'
import { ButtonLink } from '@/components/ui/Button'
import { Img } from '@/components/ui/Img'
import { Wordmark } from '@/components/layout/Wordmark'
import { images } from '@/data/images'
import { useI18n } from '@/i18n'

/**
 * Hero (brand book): two model photos side by side — the only photos in this section — with the official HALHALA logo
 * dead centre on the seam, over a black → purple wash. All text white.
 * The logo comes from `images.logo` (public/brand/logo.*); until that file is provided the text wordmark stands in.
 */
export function HeroSection() {
  const { t } = useI18n()
  const logo = images.logo
  return (
    <section className="relative isolate overflow-hidden border-b border-line bg-ink">
      <h1 className="sr-only">HALHALA — {t('hero.title1')} {t('hero.title2')}</h1>

      <div className="grid h-[min(86svh,54rem)] min-h-[30rem] grid-cols-2 gap-px bg-line">
        {images.heroPair.map((photo) => (
          <div key={photo.label} className="relative overflow-hidden">
            <Img image={photo} ratio="absolute inset-0 h-full" eager sizes="50vw" />
          </div>
        ))}
      </div>

      {/* black → purple wash keeps the logo and button readable on any photo */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_50%,rgb(9_7_13/0.55),transparent_70%),linear-gradient(to_bottom,rgb(90_48_176/0.28),rgb(9_7_13/0)_35%,rgb(9_7_13/0.9))]" />

      {/* logo: exactly centred on both axes */}
      <m.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute inset-0 grid place-items-center">
        {logo.src
          ? <img src={logo.src} alt="HALHALA" className="h-auto w-[min(62vw,34rem)] select-none drop-shadow-[0_6px_30px_rgb(0_0_0/0.55)]" />
          : <Wordmark className="!text-[clamp(3.2rem,15vw,9rem)] drop-shadow-[0_6px_30px_rgb(0_0_0/0.55)]" />}
      </m.div>

      <m.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.25 }}
        className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-5 px-5 text-center sm:bottom-12">
        <p className="font-mono text-[clamp(0.8rem,2.6vw,1.15rem)] uppercase tracking-[0.3em] text-fg drop-shadow-[0_2px_12px_rgb(0_0_0/0.7)]">{t('hero.motto')}</p>
        <ButtonLink href="/shop" className="!px-9 !py-4">{t('hero.shop')} <span aria-hidden>→</span></ButtonLink>
      </m.div>
    </section>
  )
}
