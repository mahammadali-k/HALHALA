import { CategoryGrid } from '@/features/home/CategoryGrid'
import { HeroSection } from '@/features/home/HeroSection'
import { FeatureStrip, HowItWorks, QuestionsBand } from '@/features/home/HomeSections'
import { InstagramGallery } from '@/features/home/InstagramGallery'
import { Manifesto } from '@/features/home/Manifesto'
import { TeeSection } from '@/features/home/TeeSection'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TeeSection />
      <Manifesto />
      <FeatureStrip />
      <CategoryGrid />
      <HowItWorks />
      <InstagramGallery />
      <QuestionsBand />
    </>
  )
}
