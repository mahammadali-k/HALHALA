import type { Category, Collection, Product, Size } from '@/types'
import catalog from '@/data/catalog.json'
import { gallery, images } from '@/data/images'

/**
 * Product names/prices follow the HALHALA design mock-up; stock numbers are SAMPLE values — confirm before launch.
 * Facts (id, name, price, stock) live in ./catalog.json, which the server ALSO reads: it is the single
 * source of truth for prices and initial stock. Live stock comes from the server once an order has been placed.
 * Product photos are stand-ins taken from the HALHALA lookbook until per-product photography exists.
 */
export const collections: Collection[] = [
  { id: 'mountain-goat', image: images.collections.mountain },
  { id: 'essentials', image: images.collections.essentials },
  { id: 'limited', image: images.collections.limited },
]

// Stand-in photography (HALHALA lookbook). Replace with per-product renders/photos; for a real 360° turntable add `spin` frames.
const photos: Record<string, ReturnType<typeof gallery>> = {
  p1: gallery('Keçi Ferrari', [['laundry-close', 'front'], ['back-logo', 'back with logo'], ['wall-glasses-cam', 'styled'], ['bench-glasses', 'seated']]),
  p2: gallery('Keçi BMW', [['laundry-cam', 'front'], ['back-logo', 'back'], ['bench-low', 'low angle'], ['wall-glasses-high', 'sunlit']]),
  p3: gallery('Keçi Logo', [['carpet-blur', 'front'], ['back-logo', 'back logo'], ['laundry-full', 'full look'], ['bench-zoom', 'seated']]),
  p4: gallery('Keçi Style', [['wall-glasses-cam', 'front'], ['back-logo', 'back'], ['bench-glasses', 'seated'], ['laundry-side', 'courtyard']]),
  p5: gallery('Keçi Mountain', [['laundry-side', 'front'], ['back-logo', 'back'], ['laundry-full', 'full look'], ['laundry-close', 'close']]),
  p6: gallery('Keçi Drive', [['bench-low', 'front'], ['back-logo', 'back'], ['carpet-motion', 'in motion'], ['bench-motion', 'bench']]),
  p7: gallery('Keçi Face', [['laundry-close', 'front'], ['back-logo', 'back'], ['carpet-motion', 'in motion'], ['wall-glasses-high', 'sunlit']]),
  p8: gallery('Keçi Power', [['bench-glasses', 'front'], ['back-logo', 'back'], ['carpet-blur', 'blurred'], ['bench-zoom', 'seated']]),
}

export const products: Product[] = catalog.map((c) => ({
  ...c,
  category: c.category as Category,
  stock: c.stock as Partial<Record<Size, number>>,
  images: photos[c.id],
}))
