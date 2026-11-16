import type { Product } from '@/types'
import { ProductCard } from './ProductCard'

/** Responsive grid: 2 columns on phones, 3 on large phones, 4 from tablet-portrait (768px) up. Plain CSS — cheap for big catalogues. */
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-4 md:grid-cols-4 lg:gap-x-6 lg:gap-y-12">
      {products.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
    </ul>
  )
}
