import type { Product } from '../types'
import { ProductCard } from './ProductCard'

/** Plain CSS grid — no per-item observers, keeps big catalogues cheap. */
export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-10 lg:grid-cols-4">
      {products.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
    </ul>
  )
}
