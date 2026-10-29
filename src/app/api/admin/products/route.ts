import { adminListProducts, createProduct } from '@/server/products'
import { json, route } from '@/server/http'

export const dynamic = 'force-dynamic'

export const GET = route((req) => json({ products: adminListProducts(req) }))
export const POST = route(async (req) => json({ product: await createProduct(req) }, 201))
