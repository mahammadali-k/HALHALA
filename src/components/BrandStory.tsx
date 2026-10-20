import { Link } from 'react-router-dom'
import { images } from '../data/images'
import { useI18n } from '../i18n'
import { Img } from './Img'
import { Reveal } from './Reveal'
import { Tilt } from './Tilt'

/** "Discover" banner — gold serif headline, outlined CTA, tilting model image. */
export function BrandStory() {
  const { t } = useI18n()
  return (
    <section className="container-x pt-28" aria-labelledby="story-h">
      <Reveal className="relative grid items-center gap-10 overflow-hidden border border-line bg-ink-2 md:grid-cols-2">
        <div className="relative z-10 p-8 md:p-14">
          <p className="eyebrow">{t('story.eyebrow')}</p>
          <h2 id="story-h" className="display mt-4 text-6xl uppercase tracking-[0.06em] text-gold md:text-7xl">{t('story.title')}</h2>
          <p className="mt-6 max-w-sm leading-relaxed text-muted">
            {t('story.body')}
          </p>
          <Link to="/about" className="mt-8 inline-block border border-gold px-8 py-4 text-xs uppercase tracking-[0.25em] text-gold transition-colors hover:border-burgundy hover:bg-burgundy hover:text-fg">
            {t('story.cta')}
          </Link>
        </div>
        <div className="relative mx-auto w-full max-w-sm p-6 md:max-w-none md:p-10">
          <Tilt max={9}><Img image={images.story} ratio="aspect-[4/5]" sizes="(min-width:768px) 40vw, 80vw" /></Tilt>
        </div>
      </Reveal>
    </section>
  )
}
