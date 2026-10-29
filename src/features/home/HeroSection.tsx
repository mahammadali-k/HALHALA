'use client'
import { m } from 'motion/react'
import { ButtonLink } from '@/components/ui/Button'
import { Img } from '@/components/ui/Img'
import { MountainBackdrop } from '@/components/ui/MountainBackdrop'
import { Tilt } from '@/components/ui/Tilt'
import { images } from '@/data/images'
import { useI18n } from '@/i18n'

const rise = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } } }

/**
 * Hero in the HALHALA concept: big wordmark left, visual right, mountains + a faint spray-paint watermark behind.
 * `images.heroArt` (optional transparent cut-out, e.g. the goat on the car) replaces the framed photo when provided.
 */
export function HeroSection() {
  const { t } = useI18n()
  const art = images.heroArt
  return (
    <section className="relative isolate overflow-hidden border-b border-line">
      <MountainBackdrop />
      <span aria-hidden className="font-brand pointer-events-none absolute -right-10 top-10 -z-10 -rotate-6 select-none text-[clamp(8rem,28vw,24rem)] leading-none text-accent/[0.07] blur-[1px]">HALHALA</span>

      <div className="container-x grid items-center gap-10 py-12 sm:py-16 lg:min-h-[38rem] lg:grid-cols-[1fr_1.1fr] lg:gap-4 lg:py-10">
        <m.div initial="hidden" animate="show" transition={{ staggerChildren: 0.09, delayChildren: 0.1 }} className="relative z-10">
          <m.p variants={rise} className="font-mono text-[0.78rem] font-medium uppercase tracking-[0.34em] text-accent sm:text-sm">{t('hero.tag1')}</m.p>
          <m.h1 variants={rise} className="mt-3">
            <span className="block font-display text-[clamp(3.1rem,13.5vw,7.4rem)] font-black leading-[0.9] tracking-tight">HALHALA</span>
            <span className="sr-only"> — {t('hero.title1')} {t('hero.title2')}</span>
          </m.h1>
          <m.p variants={rise} className="mt-4 font-mono text-[0.8rem] font-medium uppercase tracking-[0.42em] sm:text-base">{t('hero.tag2')}</m.p>
          <m.span variants={rise} aria-hidden className="mt-6 block h-px w-14 bg-accent-deep" />
          <m.p variants={rise} className="mt-6 max-w-[17rem] font-mono text-[0.68rem] uppercase leading-6 tracking-[0.2em] text-fg/85">{t('hero.lead')}</m.p>
          <m.div variants={rise} className="mt-9">
            <ButtonLink href="/shop" variant="outline" className="!border-accent-deep !px-8 !py-4 !text-accent hover:!text-fg">{t('hero.shop')} <span aria-hidden>→</span></ButtonLink>
          </m.div>
        </m.div>

        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }} className="relative mx-auto w-full max-w-xl lg:max-w-none">
          {art ? (
            <Img image={art} ratio="aspect-[5/4]" eager sizes="(min-width:1024px) 55vw, 100vw" className="!overflow-visible !bg-transparent" />
          ) : (
            <Tilt max={4}>
              <div className="chamfer-frame mx-auto max-w-md lg:ml-auto lg:mr-6" style={{ ['--cut' as string]: '26px' }}>
                <div className="chamfer-in relative">
                  <Img image={images.hero} ratio="aspect-[4/5]" eager sizes="(min-width:1024px) 36vw, 90vw" />
                  <div className="absolute inset-0 bg-violet/35 mix-blend-color" aria-hidden />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" aria-hidden />
                </div>
              </div>
            </Tilt>
          )}
          <div className="absolute -top-7 right-0 hidden items-start gap-3 lg:flex" aria-hidden>
            <p className="tag text-right leading-5">[ {t('hero.coll', { a: '01', b: '02' })} ]</p>
          </div>
          <span aria-hidden className="absolute -right-0.5 top-0 hidden h-28 w-px bg-accent-deep lg:block" />
        </m.div>
      </div>
    </section>
  )
}
