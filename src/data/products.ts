import type { Category, Collection, Product, Size } from '../types'
import catalog from './catalog.json'
import { gallery, images } from './images'

/**
 * SAMPLE DATA — names, prices, stock and copy are placeholders, not the real catalogue.
 * Facts (id, name, price, stock) live in ./catalog.json, which the server ALSO reads: it is the single
 * source of truth for prices and initial stock. Live stock comes from the server once an order has been placed.
 * Product photos are stand-ins taken from the HALHALA lookbook until per-product photography exists.
 */
export const collections: Collection[] = [
  { id: 'mountain-goat', image: images.collections.mountain },
  { id: 'essentials', image: images.collections.essentials },
  { id: 'limited', image: images.collections.limited },
]

const photos: Record<string, ReturnType<typeof gallery>> = {
  p1: gallery('Mountain Goat Tee', [['laundry-close', 'front'], ['back-logo', 'back with logo'], ['wall-glasses-cam', 'styled'], ['bench-glasses', 'seated']]),
  p2: gallery('High Altitude Tee', [['laundry-cam', 'front'], ['bench-low', 'low angle'], ['wall-glasses-high', 'sunlit'], ['back-logo', 'back']]),
  p3: gallery('HALHALA Logo Tee', [['back-logo', 'back logo'], ['laundry-full', 'full look'], ['bench-zoom', 'seated'], ['carpet-blur', 'front']]),
  p4: gallery('Night Ridge Tee', [['carpet-motion', 'in motion'], ['laundry-side', 'courtyard'], ['bench-glasses', 'seated'], ['wall-glasses-high', 'sunlit']]),
  p5: gallery('Courtyard Tee', [['laundry-full', 'full look'], ['laundry-side', 'front'], ['laundry-close', 'close'], ['back-logo', 'back']]),
  p6: gallery('Carpet Tee', [['carpet-blur', 'front'], ['carpet-motion', 'in motion'], ['bench-motion', 'bench'], ['bench-low', 'low angle']]),
}

export const products: Product[] = catalog.map((c) => ({
  ...c,
  category: c.category as Category,
  stock: c.stock as Partial<Record<Size, number>>,
  images: photos[c.id],
}))
