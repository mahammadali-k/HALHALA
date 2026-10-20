import { m } from 'motion/react'
import { images } from '../data/images'
import { useI18n } from '../i18n'
import { ButtonLink } from './Button'
import { Img } from './Img'
import { Tilt } from './Tilt'

const line = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } } }

export function HeroSection() {
  const { t } = useI18n()
  return (
    <section className="topo relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ink/60 via-transparent to-ink" />
      <div className="container-x grid min-h-[calc(100svh-4rem)] items-center gap-10 py-14 lg:grid-cols-2 lg:gap-16">
        {/* 3D image stack */}
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }} className="relative mx-auto mb-16 w-full max-w-md lg:max-w-none">
          <Tilt max={7} sway className="relative">
            <div className="absolute -left-3 -top-3 h-16 w-16 border-l border-t border-gold" aria-hidden />
            <div className="absolute -bottom-3 -right-3 h-16 w-16 border-b border-r border-gold" aria-hidden />
            <div className="relative w-[68%] [transform:translateZ(30px)]"><Img image={images.hero} ratio="aspect-[3/4]" eager sizes="(min-width:1024px) 30vw, 60vw" /></div>
            <div className="absolute bottom-[-12%] right-0 w-[56%] shadow-2xl shadow-black [transform:translateZ(70px)]"><Img image={images.heroSecondary} ratio="aspect-[4/5]" eager sizes="(min-width:1024px) 25vw, 50vw" /></div>
          </Tilt>
        </m.div>

        <m.div initial="hidden" animate="show" transition={{ staggerChildren: 0.1, delayChildren: 0.15 }} className="pb-10 lg:pb-0">
          <m.p variants={line} className="eyebrow mb-5">{t('hero.eyebrow')}</m.p>
          <m.h1 variants={line} className="display text-[clamp(2.8rem,7.5vw,6.5rem)] uppercase">
            {t('hero.title1')} <span className="italic text-gold">{t('hero.title2')}</span>
          </m.h1>
          <m.p variants={line} className="mt-6 max-w-md text-base text-muted">{t('hero.sub')}</m.p>
          <m.div variants={line} className="mt-9 flex flex-wrap gap-3">
            <ButtonLink to="/shop">{t('hero.cta')}</ButtonLink>
            <ButtonLink to="/about" variant="outline">{t('hero.story')}</ButtonLink>
          </m.div>
        </m.div>
      </div>
    </section>
  )
}
