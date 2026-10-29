import { Suspense } from 'react'
import { ShopView } from '@/features/shop/ShopView'
import { titleFor } from '@/i18n/server'

export const generateMetadata = titleFor('shop.eyebrow')

// useSearchParams() (filters live in the URL) needs a Suspense boundary.
export default function ShopPage() { return <Suspense><ShopView /></Suspense> }
