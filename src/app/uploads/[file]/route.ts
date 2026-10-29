import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { uploadsDir } from '@/server/products'

export const dynamic = 'force-dynamic'

/** Serves admin-uploaded product photos from the data volume (names are random, so they can be cached forever). */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  if (!/^u[a-f0-9]{16}-(480|800|1200|1600)\.webp$/.test(file)) return new Response('Not found', { status: 404 })
  try {
    const body = await readFile(path.join(uploadsDir(), file))
    return new Response(body, { headers: { 'Content-Type': 'image/webp', 'Cache-Control': 'public, max-age=31536000, immutable' } })
  } catch { return new Response('Not found', { status: 404 }) }
}
