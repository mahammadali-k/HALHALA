import type { MetadataRoute } from 'next'

// Read PUBLIC_URL and the live catalogue per request, not at build time (the Docker build has neither).
export const dynamic = 'force-dynamic'
import { listProducts } from '@/server/catalog'

export default function sitemap(): MetadataRoute.Sitemap {
  const products = listProducts()
  const base = (process.env.PUBLIC_URL ?? 'http://localhost:3000').replace(/\/$/, '')
  const pages = ['', '/shop', '/about', '/info', '/privacy', '/terms', '/contact']
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.7 })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, changeFrequency: 'weekly' as const, priority: 0.8 })),
  ]
}
