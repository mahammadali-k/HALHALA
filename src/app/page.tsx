import { HeroSection } from '@/features/home/HeroSection'
import { InstagramGallery } from '@/features/home/InstagramGallery'
import { Manifesto } from '@/features/home/Manifesto'
import { TeeSection } from '@/features/home/TeeSection'

/** Home: hero → products by category (T-shirts, Hoodies) → story → Instagram. FAQ and delivery live on their own pages. */
export default function HomePage() {
  return (
    <>
      <HeroSection />
      <TeeSection />
      <Manifesto />
      <InstagramGallery />
    </>
  )
}
