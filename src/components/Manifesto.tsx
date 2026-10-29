import { Link } from 'react-router-dom'
import { images } from '../data/images'
import { useI18n } from '../i18n'
import { Img } from './Img'
import { Reveal } from './Reveal'

/** Full-width manifesto banner (big type over a violet-tinted photo). */
export function Manifesto() {
  const { t } = useI18n()
  return (
    <section className="container-x pt-24" aria-labelledby="manifesto-h">
      <Reveal>
        <div className="chamfer-frame" style={{ ['--cut' as string]: '34px' }}>
          <div className="chamfer-in relative isolate flex min-h-[28rem] flex-col justify-end overflow-hidden sm:min-h-[34rem]">
            <div className="absolute inset-0 -z-10"><Img image={images.story} ratio="h-full" sizes="100vw" /></div>
            <div className="absolute inset-0 -z-10 bg-violet/40 mix-blend-color" aria-hidden />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-ink/10" aria-hidden />
            <p className="tag absolute left-6 top-6">[ HALHALA ]</p>
            <div className="flex flex-wrap items-end justify-between gap-6 p-6 pt-24 sm:p-10 sm:pt-28">
              <h2 id="manifesto-h" className="display text-[clamp(1.35rem,3.6vw,3rem)]">
                {t('man.1')}<br />{t('man.2')}<br /><span className="text-accent">{t('man.3')}</span>
              </h2>
              <div className="max-w-[16rem] sm:text-right">
                <p className="font-mono text-[0.7rem] uppercase leading-5 tracking-[0.2em] text-fg/80">{t('footer.slogan')}</p>
                <Link to="/shop" className="mt-4 inline-block border border-accent px-6 py-3 font-mono text-[0.68rem] uppercase tracking-[0.25em] text-accent transition-colors hover:border-violet hover:bg-violet hover:text-fg">{t('hero.cta')} →</Link>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
