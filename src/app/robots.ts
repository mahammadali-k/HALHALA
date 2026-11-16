import type { MetadataRoute } from 'next'

// Read PUBLIC_URL and the live catalogue per request, not at build time (the Docker build has neither).
export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.PUBLIC_URL ?? '').replace(/\/$/, '')
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/admin', '/account', '/checkout', '/order/', '/login', '/register'] },
    ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
  }
}
