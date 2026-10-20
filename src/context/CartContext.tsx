import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import { getProductById, stockFor } from '../lib/catalog'
import { useCatalog } from './CatalogContext'
import { SIZES, type CartItem, type Product, type Size } from '../types'

const STORAGE_KEY = 'halhala.cart.v1'

type Action =
  | { type: 'add'; productId: string; size: Size; quantity: number }
  | { type: 'set'; productId: string; size: Size; quantity: number }
  | { type: 'remove'; productId: string; size: Size }
  | { type: 'replace'; items: CartItem[] }
  | { type: 'revalidate' }
  | { type: 'clear' }

const same = (a: CartItem, productId: string, size: Size) => a.productId === productId && a.size === size

/** Clamp to what's in stock for that size (0 if the product/size no longer exists). */
const clamp = (productId: string, size: Size, q: number) => {
  const p = getProductById(productId)
  return p ? Math.max(0, Math.min(Math.floor(q), stockFor(p, size))) : 0
}

function reducer(state: CartItem[], a: Action): CartItem[] {
  switch (a.type) {
    case 'add': {
      const existing = state.find((i) => same(i, a.productId, a.size))
      const q = clamp(a.productId, a.size, (existing?.quantity ?? 0) + a.quantity)
      if (q === 0) return state
      return existing
        ? state.map((i) => (same(i, a.productId, a.size) ? { ...i, quantity: q } : i))
        : [...state, { productId: a.productId, size: a.size, quantity: q }]
    }
    case 'set': {
      const q = clamp(a.productId, a.size, a.quantity)
      return q === 0
        ? state.filter((i) => !same(i, a.productId, a.size))
        : state.map((i) => (same(i, a.productId, a.size) ? { ...i, quantity: q } : i))
    }
    case 'remove':
      return state.filter((i) => !same(i, a.productId, a.size))
    case 'replace':
      return a.items
    case 'revalidate':
      return state.flatMap((i) => { const q = Math.min(i.quantity, clamp(i.productId, i.size, i.quantity)); return q > 0 ? [{ ...i, quantity: q }] : [] })
    case 'clear':
      return []
  }
}

/** Defensive load: drops anything malformed, unknown, or out of stock. */
function load(): CartItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(raw)) return []
    return raw.flatMap((i): CartItem[] => {
      if (!i || typeof i.productId !== 'string' || !SIZES.includes(i.size) || !Number.isFinite(i.quantity)) return []
      const q = clamp(i.productId, i.size, i.quantity)
      return q > 0 ? [{ productId: i.productId, size: i.size, quantity: q }] : []
    })
  } catch {
    return []
  }
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
  /** `n` increments on every add so the UI can react (badge bump, toast). */
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
  const [items, dispatch] = useReducer(reducer, undefined, load)
  const { version } = useCatalog()
  const [isOpen, setOpen] = useState(false)
  const [lastAdded, setLastAdded] = useState<CartCtx['lastAdded']>(null)

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch { /* storage unavailable: cart is session-only */ }
  }, [items])

  // live stock changed (someone ordered / admin edited): trim cart lines to what is still available
  useEffect(() => { if (version > 0) dispatch({ type: 'revalidate' }) }, [version])

  // keep other tabs in sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) dispatch({ type: 'replace', items: load() })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // `version` forces max quantities to be recomputed after a stock update
  const lines = useMemo<CartLine[]>(
    () => items.flatMap((item) => {
      const product = getProductById(item.productId)
      return product ? [{ key: `${item.productId}-${item.size}`, item, product, subtotal: product.price * item.quantity, maxQuantity: stockFor(product, item.size) }] : []
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, version],
  )
  const count = lines.reduce((n, l) => n + l.item.quantity, 0)
  const total = lines.reduce((n, l) => n + l.subtotal, 0)

  const add = useCallback((p: Product, size: Size, quantity: number) => {
    dispatch({ type: 'add', productId: p.id, size, quantity })
    setLastAdded((prev) => ({ name: p.name, size, n: (prev?.n ?? 0) + 1 }))
  }, [])
  const open = useCallback(() => setOpen(true), [])
  const close = useCallback(() => setOpen(false), [])

  const value = useMemo<CartCtx>(() => ({
    lines, count, total, isOpen, lastAdded, open, close, add,
    setQuantity: (productId, size, quantity) => dispatch({ type: 'set', productId, size, quantity }),
    remove: (productId, size) => dispatch({ type: 'remove', productId, size }),
    clear: () => dispatch({ type: 'clear' }),
  }), [lines, count, total, isOpen, lastAdded, open, close, add])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useCart must be used inside <CartProvider>')
  return c
}
