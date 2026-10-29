import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { products } from '@/data/products'
import { prodKey } from '@/i18n'
import { getT } from '@/i18n/server'
import { ProductView } from '@/features/product/ProductView'
import { liveCatalog } from '@/server/catalog'

type Props = { params: Promise<{ slug: string }> }
const find = (slug: string) => products.find((p) => p.slug === slug)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = find((await params).slug)
  if (!p) return {}
  const description = (await getT())(prodKey(p.id))
  return { title: p.name, description, openGraph: { title: p.name, description, images: p.images[0]?.src ? [`${p.images[0].src}-1200.webp`] : undefined } }
}

export default async function ProductPage({ params }: Props) {
  const p = find((await params).slug)
  if (!p) notFound()
  const { stock, prices } = liveCatalog()
  const inStock = Object.values(stock[p.id] ?? p.stock).some((n) => (n ?? 0) > 0)
  // schema.org Product markup for search engines
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.name, description: (await getT())(prodKey(p.id)),
    image: p.images[0]?.src ? [`${(process.env.PUBLIC_URL ?? '').replace(/\/$/, '')}${p.images[0].src}-1200.webp`] : undefined,
    brand: { '@type': 'Brand', name: 'HALHALA' },
    offers: { '@type': 'Offer', priceCurrency: 'AZN', price: prices[p.id] ?? p.price, availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' },
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <ProductView slug={p.slug} />
    </>
  )
}
