import { BrandStory } from '../components/BrandStory'
import { ButtonLink } from '../components/Button'
import { CollectionGrid } from '../components/CollectionGrid'
import { HeroSection } from '../components/HeroSection'
import { FeatureStrip, HowItWorks, QuestionsBand } from '../components/HomeSections'
import { InstagramGallery } from '../components/InstagramGallery'
import { Ornament } from '../components/Ornament'
import { ProductGrid } from '../components/ProductGrid'
import { Heading } from '../components/ui'
import { products } from '../data/products'
import { useI18n } from '../i18n'

function ProductRow({ id, eyebrow, title, items, to }: { id: string; eyebrow: string; title: string; items: typeof products; to: string }) {
  const { t } = useI18n()
  return (
    <section className="container-x pt-28" aria-labelledby={id}>
      <Heading eyebrow={eyebrow} title={title} id={id} className="mb-12" action={<ButtonLink to={to} variant="outline">{t('common.viewAll')}</ButtonLink>} />
      <ProductGrid products={items} />
    </section>
  )
}

export default function Home() {
  const { t } = useI18n()
  const best = products.filter((p) => p.bestSeller).slice(0, 4)
  const newest = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4)
  return (
    <>
      <HeroSection />
      <FeatureStrip />
      <Ornament className="pt-20" />
      <CollectionGrid />
      <ProductRow id="best-h" eyebrow={t('home.best.eyebrow')} title={t('home.best.title')} items={best} to="/shop?sort=featured" />
      <HowItWorks />
      <BrandStory />
      <ProductRow id="new-h" eyebrow={t('home.new.eyebrow')} title={t('home.new.title')} items={newest} to="/shop?sort=newest" />
      <Ornament className="pt-28" />
      <InstagramGallery />
      <QuestionsBand />
    </>
  )
}
