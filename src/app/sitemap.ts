import type { MetadataRoute } from 'next'
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
