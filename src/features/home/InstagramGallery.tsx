'use client'
import { images } from '@/data/images'
import { site } from '@/data/site'
import { useI18n } from '@/i18n'
import { Img } from '@/components/ui/Img'
import { Heading } from '@/components/ui/Heading'
import { accentLink } from '@/components/ui/styles'

const ratios = ['aspect-[3/4]', 'aspect-square', 'aspect-[4/5]', 'aspect-[4/5]', 'aspect-[3/4]', 'aspect-square']

export function InstagramGallery() {
  const { t } = useI18n()
  return (
    <section id="lookbook" className="container-x scroll-mt-24 pt-12" aria-labelledby="ig-h">
      <Heading eyebrow={t('look.eyebrow')} title={`@${site.instagramHandle}`} id="ig-h"
        action={<a href={site.instagramUrl} target="_blank" rel="noreferrer" className={accentLink}>{t('look.follow')}</a>} />
      <ul className="mt-10 columns-2 gap-2 md:columns-3 [&>li]:mb-2 [&>li]:break-inside-avoid">
        {images.social.map((img, i) => (
          <li key={i}>
            <a href={site.instagramUrl} target="_blank" rel="noreferrer" aria-label={`${img.alt} (opens Instagram)`} className="group block overflow-hidden">
              <div className="transition-transform duration-500 group-hover:scale-105"><Img image={img} ratio={ratios[i % ratios.length]} sizes="(min-width:768px) 33vw, 50vw" /></div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
