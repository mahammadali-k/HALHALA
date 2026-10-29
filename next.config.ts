import type { NextConfig } from 'next'

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  ...(process.env.PUBLIC_URL?.startsWith('https') ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }] : []),
]

const config: NextConfig = {
  // Docker builds set NEXT_OUTPUT=standalone → self-contained server bundle (.next/standalone). Plain `next start` otherwise.
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  poweredByHeader: false,
  agentRules: false,
  reactStrictMode: true,
  // Photos are pre-optimised into 480/800/1200/1600px WebP by `npm run images`; the loader just picks the right file.
  images: {
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
    deviceSizes: [480, 800, 1200, 1600],
    imageSizes: [96, 160, 320],
  },
  async headers() {
    return [
      { source: '/:path*', headers: SECURITY_HEADERS },
      // optimised photos never change under the same name → cache for a year
      { source: '/images/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    ]
  },
}

export default config
