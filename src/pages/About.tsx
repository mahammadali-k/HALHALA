import { ButtonLink } from '../components/Button'
import { Img } from '../components/Img'
import { Ornament } from '../components/Ornament'
import { Reveal } from '../components/Reveal'
import { Heading } from '../components/ui'
import { images } from '../data/images'
import { useI18n, type Key } from '../i18n'

const values = ['1', '2', '3'] as const

export default function About() {
  const { t } = useI18n()
  return (
    <div className="container-x pt-14">
      <Reveal>
        <Heading as="h1" size="lg" eyebrow={t('about.eyebrow')} reveal={false} title={<>{t('about.t1')} <span className="italic text-gold">{t('about.t2')}</span></>} />
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
              <h3 className="font-display text-3xl text-gold">{t(`about.v${n}.t` as Key)}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{t(`about.v${n}.d` as Key)}</p>
            </li>
          ))}
        </ul>
      </section>
      <div className="mt-20 text-center"><ButtonLink to="/shop">{t('hero.cta')}</ButtonLink></div>
    </div>
  )
}
