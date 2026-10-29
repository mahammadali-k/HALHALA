import type { LangId, Product } from '@/types'

/** Shapes exchanged between the API (src/server, src/app/api) and the browser. One definition, used by both sides. */
/** Live catalogue snapshot (products with current stock and prices). Returned by every endpoint that changes stock. */
export interface LiveCatalog { products: Product[] }

export interface Config { payments: string[]; currency: string }

export type PolicyKind = 'delivery' | 'returns' | 'privacy' | 'terms'
export const POLICY_KINDS: PolicyKind[] = ['delivery', 'returns', 'privacy', 'terms']
/** Store-wide settings, editable in the admin panel (all public — never put secrets here). */
export interface StoreSettings {
  email: string; phone: string; address: string
  /** Instagram handle without @ — DM and profile links are derived from it. */
  instagramHandle: string
  tiktokUrl: string
  /** Founding year shown as "Est. 2024". */
  est: string
  deliveryFee: number
  freeDeliveryFrom: number | null
  policies: Record<PolicyKind, Record<LangId, string>>
}

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
