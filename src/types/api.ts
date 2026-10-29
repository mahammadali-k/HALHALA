import type { Size } from '@/types'

/** Shapes exchanged between the API (src/server, src/app/api) and the browser. One definition, used by both sides. */
export type StockMap = Record<string, Partial<Record<Size, number>>>
export type PriceMap = Record<string, number>
/** Live catalogue state (stock + admin price overrides). */
export interface LiveCatalog { stock: StockMap; prices: PriceMap }

export interface Config { payments: string[]; currency: string; deliveryFee: number; freeDeliveryFrom: number | null }

export type Role = 'customer' | 'admin'
export interface User { id: number; email: string; name: string; phone: string; city: string; address: string; role: Role }
export interface UserRow extends User { createdAt: string; orders: number; spent: number }

export interface OrderItem { productId: string; name: string; size: string; quantity: number; unitPrice: number }
export type OrderStatus = 'new' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded'
export interface Order {
  number: string; status: OrderStatus; paymentMethod: string; paymentStatus: PaymentStatus
  subtotal: number; deliveryFee: number; total: number
  name: string; phone: string; email: string; city: string; address: string; notes: string
  createdAt: string; paidAt: string | null; items: OrderItem[]
}
export const ORDER_STATUSES: OrderStatus[] = ['new', 'confirmed', 'shipped', 'delivered', 'cancelled']
export const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = { new: ['confirmed', 'cancelled'], confirmed: ['shipped', 'cancelled'], shipped: ['delivered', 'cancelled'], delivered: [], cancelled: [] }
export const PAYMENT_STATUSES: PaymentStatus[] = ['unpaid', 'pending', 'paid', 'failed', 'refunded']

export interface Stats {
  ordersToday: number; ordersTotal: number; byStatus: Record<OrderStatus, number>
  revenuePaid: number; revenueExpected: number; users: number
  lowStock: { productId: string; name: string; size: string; qty: number }[]
}

/** POST /api/orders response */
export interface CreatedOrder extends LiveCatalog { order: Order; token: string; paymentUrl: string | null }

export interface CheckoutContact { name: string; phone: string; email: string; city: string; address: string; notes: string }
