import { Link } from 'react-router-dom'
import { CollectionGrid } from '../components/CollectionGrid'
import { HeroSection } from '../components/HeroSection'
import { FeatureStrip, HowItWorks, QuestionsBand } from '../components/HomeSections'
import { InstagramGallery } from '../components/InstagramGallery'
import { Manifesto } from '../components/Manifesto'
import { ProductGrid } from '../components/ProductGrid'
import { Heading, accentLink } from '../components/ui'
import { products } from '../data/products'
import { useI18n } from '../i18n'

export default function Home() {
  const { t } = useI18n()
  return (
    <>
      <HeroSection />
      <section className="container-x pt-16" aria-labelledby="tees-h">
        <Heading eyebrow={t('cp.eyebrow')} title={t('cat.T-Shirts')} id="tees-h" className="mb-10"
          action={<Link to="/shop" className={accentLink}>{t('common.viewAll')} →</Link>} />
        <ProductGrid products={products} />
      </section>
      <Manifesto />
      <FeatureStrip />
      <CollectionGrid />
      <HowItWorks />
      <InstagramGallery />
      <QuestionsBand />
    </>
  )
}
