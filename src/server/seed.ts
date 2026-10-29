import type { Category, Size } from '@/types'

/**
 * First-run catalogue (inserted only while the products table is empty). After that the catalogue lives in the
 * database and is managed in the admin panel (Products tab) — edit prices, stock, texts and photos there.
 * Prices of hoodies and all stock numbers are SAMPLE values: change them in the admin panel before launch.
 */
export interface SeedProduct {
  id: string; slug: string; name: string; category: Category; price: number; bestSeller?: boolean
  description: { en: string; az: string; ru: string }
  /** Optimised photo names in /public/images (see `npm run images`). The 2nd photo is used as the back side in the 360° view. */
  photos: [name: string, alt: string][]
  stock: Partial<Record<Size, number>>
}

const sizes = (S: number, M: number, L: number, XL: number, XXL: number) => ({ S, M, L, XL, XXL })

export const SEED_PRODUCTS: SeedProduct[] = [
  { id: 'p1', slug: 'kechi-ferrari', name: 'Kechi Ferrari', category: 'T-Shirts', price: 28, bestSeller: true,
    description: { en: 'Black tee with the goat in a gold chain standing on a red Ferrari.', az: 'Qırmızı Ferrari-nin üstündə qızıl zəncirli keçi çəkilmiş qara köynək.', ru: 'Чёрная футболка с козлом в золотой цепи на красном Ferrari.' },
    photos: [['tee-ferrari', 'Kechi Ferrari tee']], stock: sizes(6, 10, 8, 4, 2) },
  { id: 'p2', slug: 'kechi-bmw', name: 'Kechi BMW', category: 'T-Shirts', price: 28, bestSeller: true,
    description: { en: 'Black tee with the goat in a gold chain standing on a black BMW. HALHALA mark at the neck.', az: 'Qara BMW-nin üstündə qızıl zəncirli keçi çəkilmiş qara köynək. Yaxada HALHALA işarəsi.', ru: 'Чёрная футболка с козлом в золотой цепи на чёрной BMW. Знак HALHALA у горловины.' },
    photos: [['tee-bmw', 'Kechi BMW tee'], ['back-logo', 'HALHALA mark on the collar'], ['laundry-close', 'Worn in a courtyard'], ['wall-glasses-cam', 'Styled with glasses']], stock: sizes(5, 9, 9, 3, 1) },
  { id: 'p3', slug: 'kechi-bmw-classic', name: 'Kechi BMW Classic', category: 'T-Shirts', price: 28, bestSeller: true,
    description: { en: 'Oversized black tee: the goat with a triple gold chain on a classic black BMW.', az: 'Oversize qara köynək: klassik qara BMW-nin üstündə üçqat qızıl zəncirli keçi.', ru: 'Оверсайз футболка: козёл с тройной золотой цепью на классической чёрной BMW.' },
    photos: [['tee-bmw-classic', 'Kechi BMW Classic oversized tee']], stock: sizes(8, 12, 10, 6, 3) },
  { id: 'p4', slug: 'kechi-mercedes', name: 'Kechi Mercedes', category: 'T-Shirts', price: 28, bestSeller: true,
    description: { en: 'Black tee with the goat in a gold chain on a white Mercedes.', az: 'Ağ Mercedes-in üstündə qızıl zəncirli keçi çəkilmiş qara köynək.', ru: 'Чёрная футболка с козлом в золотой цепи на белом Mercedes.' },
    photos: [['tee-mercedes', 'Kechi Mercedes tee']], stock: sizes(4, 7, 7, 5, 2) },
  { id: 'p5', slug: 'kechi-bmw-hoodie', name: 'Kechi BMW Hoodie', category: 'Hoodies', price: 55,
    description: { en: 'Heavy black hoodie with the goat and a triple gold chain on a classic black BMW.', az: 'Klassik qara BMW-nin üstündə üçqat qızıl zəncirli keçi çəkilmiş qalın qara hudi.', ru: 'Плотное чёрное худи с козлом в тройной золотой цепи на классической чёрной BMW.' },
    photos: [['hoodie-bmw', 'Kechi BMW hoodie']], stock: sizes(3, 6, 6, 3, 1) },
  { id: 'p6', slug: 'kechi-ferrari-hoodie', name: 'Kechi Ferrari Hoodie', category: 'Hoodies', price: 55,
    description: { en: 'Heavy black hoodie with the goat in a gold chain on a red Ferrari.', az: 'Qırmızı Ferrari-nin üstündə qızıl zəncirli keçi çəkilmiş qalın qara hudi.', ru: 'Плотное чёрное худи с козлом в золотой цепи на красном Ferrari.' },
    photos: [['hoodie-ferrari', 'Kechi Ferrari hoodie']], stock: sizes(3, 5, 5, 3, 1) },
]
