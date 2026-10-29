import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLang } from '@/i18n/server'
import { describe } from '@/lib/catalog'
import { ProductView } from '@/features/product/ProductView'
import { productBySlug } from '@/server/catalog'

type Props = { params: Promise<{ slug: string }> }

const publicUrl = () => (process.env.PUBLIC_URL ?? '').replace(/\/$/, '')

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = productBySlug((await params).slug)
  if (!p) return {}
  const description = describe(p, await getLang())
  const image = p.images[0]?.src ? [`${p.images[0].src}-1200.webp`] : undefined
  return { title: p.name, description, openGraph: { title: p.name, description, images: image } }
}

export default async function ProductPage({ params }: Props) {
  const p = productBySlug((await params).slug)
  if (!p) notFound()
  const inStock = Object.values(p.stock).some((n) => (n ?? 0) > 0)
  // schema.org Product markup for search engines
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: describe(p, await getLang()),
    image: p.images[0]?.src ? [`${publicUrl()}${p.images[0].src}-1200.webp`] : undefined,
    brand: { '@type': 'Brand', name: 'HALHALA' },
    offers: { '@type': 'Offer', priceCurrency: 'AZN', price: p.price, availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <ProductView slug={p.slug} />
    </>
  )
}
