import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.PUBLIC_URL ?? '').replace(/\/$/, '')
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/admin', '/account', '/checkout', '/order/', '/login', '/register'] },
    ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
  }
}
