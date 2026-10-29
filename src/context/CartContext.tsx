'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { stockFor } from '@/lib/catalog'
import { SIZES, type CartItem, type Product, type Size } from '@/types'
import { useCatalog } from '@/context/CatalogContext'

const STORAGE_KEY = 'halhala.cart.v1'
/** Max purchasable quantity for a product/size right now (0 when unknown or sold out). */
type MaxOf = (productId: string, size: Size) => number

type Action =
  | { type: 'add'; productId: string; size: Size; quantity: number; max: number }
  | { type: 'set'; productId: string; size: Size; quantity: number; max: number }
  | { type: 'remove'; productId: string; size: Size }
  | { type: 'replace'; items: CartItem[] }
  | { type: 'trim'; maxOf: MaxOf }
  | { type: 'clear' }

const same = (a: CartItem, productId: string, size: Size) => a.productId === productId && a.size === size
const bound = (q: number, max: number) => Math.max(0, Math.min(Math.floor(q), max))

function reducer(state: CartItem[], a: Action): CartItem[] {
  switch (a.type) {
    case 'add': {
      const existing = state.find((i) => same(i, a.productId, a.size))
      const q = bound((existing?.quantity ?? 0) + a.quantity, a.max)
      if (q === 0) return state
      return existing ? state.map((i) => (same(i, a.productId, a.size) ? { ...i, quantity: q } : i)) : [...state, { productId: a.productId, size: a.size, quantity: q }]
    }
    case 'set': {
      const q = bound(a.quantity, a.max)
      return q === 0 ? state.filter((i) => !same(i, a.productId, a.size)) : state.map((i) => (same(i, a.productId, a.size) ? { ...i, quantity: q } : i))
    }
    case 'remove': return state.filter((i) => !same(i, a.productId, a.size))
    case 'replace': return a.items
    case 'trim': return state.flatMap((i) => { const q = bound(i.quantity, a.maxOf(i.productId, i.size)); return q > 0 ? [{ ...i, quantity: q }] : [] })
    case 'clear': return []
  }
}

function readStorage(): CartItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as unknown
    if (!Array.isArray(raw)) return []
    return raw.filter((i): i is CartItem => !!i && typeof i.productId === 'string' && SIZES.includes(i.size) && Number.isFinite(i.quantity))
  } catch { return [] }
}

export interface CartLine {
  /** Stable React key: one line per product + size. */
  key: string
  item: CartItem
  product: Product
  subtotal: number
  maxQuantity: number
}

interface CartCtx {
  lines: CartLine[]
  count: number
  total: number
  isOpen: boolean
  /** `n` increments on every add so the UI can react (toast, badge bump). */
  lastAdded: { name: string; size: Size; n: number } | null
  open: () => void
  close: () => void
  add: (p: Product, size: Size, quantity: number) => void
  setQuantity: (productId: string, size: Size, quantity: number) => void
  remove: (productId: string, size: Size) => void
  clear: () => void
}
const Ctx = createContext<CartCtx | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { products, getProduct } = useCatalog()
  const [items, dispatch] = useReducer(reducer, [])
  const [isOpen, setOpen] = useState(false)
  const [lastAdded, setLastAdded] = useState<CartCtx['lastAdded']>(null)
  const hydrated = useRef(false)

  const maxOf = useCallback<MaxOf>((id, size) => { const p = getProduct(id); return p ? stockFor(p, size) : 0 }, [getProduct])

  // The server renders an empty cart; the saved cart is loaded after hydration (avoids a server/client mismatch).
  useEffect(() => {
    dispatch({ type: 'replace', items: readStorage() })
    dispatch({ type: 'trim', maxOf })
    hydrated.current = true
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) dispatch({ type: 'replace', items: readStorage() }) } // other tabs
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => { if (hydrated.current) try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch { /* storage unavailable: session-only cart */ } }, [items])
  // live stock changed (someone ordered / admin edited): trim lines to what is still available
  useEffect(() => { if (hydrated.current) dispatch({ type: 'trim', maxOf }) }, [products, maxOf])

  const lines = useMemo<CartLine[]>(() => items.flatMap((item) => {
    const product = getProduct(item.productId)
    return product ? [{ key: `${item.productId}-${item.size}`, item, product, subtotal: product.price * item.quantity, maxQuantity: stockFor(product, item.size) }] : []
  }), [items, getProduct])
  const count = lines.reduce((n, l) => n + l.item.quantity, 0)
  const total = lines.reduce((n, l) => n + l.subtotal, 0)

  const value = useMemo<CartCtx>(() => ({
    lines, count, total, isOpen, lastAdded,
    open: () => setOpen(true),
    close: () => setOpen(false),
    add: (p, size, quantity) => { dispatch({ type: 'add', productId: p.id, size, quantity, max: stockFor(p, size) }); setLastAdded((prev) => ({ name: p.name, size, n: (prev?.n ?? 0) + 1 })) },
    setQuantity: (productId, size, quantity) => dispatch({ type: 'set', productId, size, quantity, max: maxOf(productId, size) }),
    remove: (productId, size) => dispatch({ type: 'remove', productId, size }),
    clear: () => dispatch({ type: 'clear' }),
  }), [lines, count, total, isOpen, lastAdded, maxOf])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useCart() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCart must be used inside <CartProvider>')
  return c
}
