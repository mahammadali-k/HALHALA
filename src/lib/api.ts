import type { Config } from '@/types/api'

/** Error from the HALHALA API (`code` is the server's error id, mapped to text by lib/errors.ts). */
export class ApiError extends Error {
  status: number
  code: string
  data: Record<string, unknown>
  constructor(status: number, code: string, data: Record<string, unknown> = {}) {
    super(code)
    this.status = status
    this.code = code
    this.data = data
  }
}

/** JSON fetch wrapper: cookie session + the CSRF header the server requires. */
export async function api<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  let r: Response
  try {
    r = await fetch(path, {
      method: opts.method ?? 'GET', credentials: 'same-origin',
      headers: { 'X-Requested-With': 'halhala', ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    })
  } catch { throw new ApiError(0, 'offline') }
  if (!(r.headers.get('content-type') ?? '').includes('json')) throw new ApiError(0, 'offline')
  const data = (await r.json()) as Record<string, unknown>
  if (!r.ok) throw new ApiError(r.status, String(data.error ?? 'server'), data)
  return data as T
}

export const deliveryFeeFor = (cfg: Config, subtotal: number) =>
  cfg.deliveryFee <= 0 || (cfg.freeDeliveryFrom !== null && subtotal >= cfg.freeDeliveryFrom) ? 0 : cfg.deliveryFee
