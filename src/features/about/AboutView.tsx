'use client'
import { ButtonLink } from '@/components/ui/Button'
import { Img } from '@/components/ui/Img'
import { Ornament } from '@/components/ui/Ornament'
import { Reveal } from '@/components/ui/Reveal'
import { Heading } from '@/components/ui/Heading'
import { images } from '@/data/images'
import { useI18n, type Key } from '@/i18n'

const values = ['1', '2', '3'] as const

export function AboutView() {
  const { t } = useI18n()
  return (
    <div className="container-x pt-14">
      <Reveal>
        <Heading as="h1" size="lg" eyebrow={t('about.eyebrow')} reveal={false} title={<>{t('about.t1')} <span className="italic text-accent">{t('about.t2')}</span></>} />
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">{t('about.lead')}</p>
      </Reveal>
      <div className="mt-16 grid gap-4 md:grid-cols-3">
        {images.about.map((img, i) => <Reveal key={i} delay={i * 0.1}><Img image={img} ratio={i === 1 ? 'aspect-[3/4]' : 'aspect-[4/5]'} sizes="(min-width:768px) 33vw, 100vw" /></Reveal>)}
      </div>
      <Ornament className="mt-24" />
      <section className="mt-16" aria-labelledby="values-h">
        <Heading id="values-h" title={t('about.values')} />
        <ul className="mt-10 grid gap-px border border-line bg-line md:grid-cols-3">
          {values.map((n) => (
            <li key={n} className="bg-ink p-8">
              <h3 className="font-display text-3xl text-accent">{t(`about.v${n}.t` as Key)}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{t(`about.v${n}.d` as Key)}</p>
            </li>
          ))}
        </ul>
      </section>
      <div className="mt-20 text-center"><ButtonLink href="/shop">{t('hero.cta')}</ButtonLink></div>
    </div>
  )
}
