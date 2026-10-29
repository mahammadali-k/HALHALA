import { m } from 'motion/react'
import { images } from '../data/images'
import { useI18n } from '../i18n'
import { ButtonLink } from './Button'
import { Img } from './Img'
import { Tilt } from './Tilt'

const rise = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const } } }
const thumbs = [images.heroSecondary, images.social[2]]

export function HeroSection() {
  const { t } = useI18n()
  return (
    <section className="relative isolate overflow-hidden border-b border-line">
      <div className="glow absolute inset-0 -z-10" aria-hidden />
      <div className="topo absolute inset-0 -z-10 opacity-40" aria-hidden />
      <div className="container-x grid items-center gap-10 py-14 lg:min-h-[40rem] lg:grid-cols-[1fr_1.05fr] lg:gap-6">
        <m.div initial="hidden" animate="show" transition={{ staggerChildren: 0.1, delayChildren: 0.1 }} className="relative z-10">
          <m.p variants={rise} className="eyebrow">{t('hero.limited')}</m.p>
          <m.h1 variants={rise} className="mt-5">
            <span className="font-brand block text-[clamp(4.5rem,14vw,9.5rem)] leading-[0.85] tracking-wide">HALHALA</span>
            <span className="sr-only"> — {t('hero.title1')} {t('hero.title2')}</span>
          </m.h1>
          <m.p variants={rise} className="mt-8 font-mono text-xs uppercase leading-7 tracking-[0.42em] text-fg/90">
            {t('hero.tag1')}<br />{t('hero.tag2')}
          </m.p>
          <m.div variants={rise} className="mt-10">
            <ButtonLink to="/shop" variant="outline" className="!border-accent !text-accent hover:!text-fg">{t('hero.shop')} <span aria-hidden>→</span></ButtonLink>
          </m.div>
        </m.div>

        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.9 }} className="relative">
          <div className="grid grid-cols-[1fr_5.5rem] gap-3 sm:grid-cols-[1fr_7rem]">
            <Tilt max={5} className="min-w-0">
              <div className="chamfer-frame" style={{ ['--cut' as string]: '26px' }}>
                <div className="chamfer-in relative">
                  <Img image={images.hero} ratio="aspect-[4/5]" eager sizes="(min-width:1024px) 38vw, 70vw" />
                  <div className="absolute inset-0 bg-violet/35 mix-blend-color" aria-hidden />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" aria-hidden />
                  <p className="tag absolute bottom-3 left-4">[ 01 — 03 ]</p>
                </div>
              </div>
            </Tilt>
            <div className="flex flex-col gap-3">
              {thumbs.map((img, i) => (
                <div key={i} className="chamfer-frame" style={{ ['--cut' as string]: '12px' }}>
                  <div className="chamfer-in relative"><Img image={img} ratio="aspect-[3/4]" eager sizes="120px" /><div className="absolute inset-0 bg-violet/30 mix-blend-color" aria-hidden /></div>
                </div>
              ))}
            </div>
          </div>
        </m.div>
      </div>
    </section>
  )
}
