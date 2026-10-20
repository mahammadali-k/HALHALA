import type { Size } from '../types'

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

/** JSON fetch wrapper for the HALHALA API. Sends the cookie session + the CSRF header the server requires. */
export async function api<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  let r: Response
  try {
    r = await fetch(path, {
      method: opts.method ?? 'GET', credentials: 'same-origin',
      headers: { 'X-Requested-With': 'halhala', ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    })
  } catch { throw new ApiError(0, 'offline') }
  if (!(r.headers.get('content-type') ?? '').includes('json')) throw new ApiError(0, 'offline') // static host without the API
  const data = (await r.json()) as Record<string, unknown>
  if (!r.ok) throw new ApiError(r.status, String(data.error ?? 'server'), data)
  return data as T
}

export type StockMap = Record<string, Partial<Record<Size, number>>>
export type PriceMap = Record<string, number>
/** Live catalogue state returned by the server alongside most order/admin responses. */
export interface LiveCatalog { stock: StockMap; prices?: PriceMap }
export interface Config { payments: string[]; currency: string; deliveryFee: number; freeDeliveryFrom: number | null }
export interface UserRow extends User { createdAt: string; orders: number; spent: number }
export interface Stats {
  ordersToday: number; ordersTotal: number; byStatus: Record<OrderStatus, number>; revenuePaid: number; revenueExpected: number; users: number
  lowStock: { productId: string; name: string; size: string; qty: number }[]
}
export interface User { id: number; email: string; name: string; phone: string; city: string; address: string; role: 'customer' | 'admin' }
export interface OrderItem { productId: string; name: string; size: string; quantity: number; unitPrice: number }
export type OrderStatus = 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'
export interface Order {
  number: string; status: OrderStatus; paymentMethod: string; paymentStatus: PaymentStatus
  subtotal: number; deliveryFee: number; total: number
  name: string; phone: string; email: string; city: string; address: string; notes: string; createdAt: string; paidAt: string | null; items: OrderItem[]
}
export const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = { new: ['confirmed', 'cancelled'], confirmed: ['shipped', 'cancelled'], shipped: ['delivered', 'cancelled'], delivered: [], cancelled: [] }

export const deliveryFeeFor = (cfg: Config | null, subtotal: number) =>
  !cfg || cfg.deliveryFee <= 0 || (cfg.freeDeliveryFrom !== null && subtotal >= cfg.freeDeliveryFrom) ? 0 : cfg.deliveryFee
