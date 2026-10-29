import 'server-only'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import type { DatabaseSync, SQLInputValue } from 'node:sqlite'
import { photoMeta, type PhotoName } from '@/data/photos.generated'
import { SEED_PRODUCTS } from './seed'

/**
 * SQLite through Node's built-in `node:sqlite` (Node ≥ 22.13, no native build step).
 * `process.getBuiltinModule` keeps the bundler away from the import; the handle is cached on globalThis so
 * dev hot-reloads reuse one connection. The database is created lazily on first use (never at build time).
 *
 * The catalogue (products, photos, stock) and the store settings live here and are edited in the admin panel; on a brand-new
 * database the catalogue is seeded from ./seed.ts.
 */
const g = globalThis as unknown as { __halhalaDb?: DatabaseSync }

export const db = (): DatabaseSync => (g.__halhalaDb ??= open())

function open(): DatabaseSync {
  const { DatabaseSync: Sqlite } = process.getBuiltinModule('node:sqlite')
  const dir = process.env.DATA_DIR || path.join(process.cwd(), 'data')
  mkdirSync(dir, { recursive: true })
  const d = new Sqlite(path.join(dir, 'halhala.db'))
  d.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      phone TEXT, city TEXT, address TEXT, password_hash TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'customer',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS stock (
      product_id TEXT NOT NULL, size TEXT NOT NULL, qty INTEGER NOT NULL CHECK (qty >= 0), PRIMARY KEY (product_id, size)
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, category TEXT NOT NULL,
      price_q INTEGER NOT NULL CHECK (price_q > 0), -- qəpik
      best_seller INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1,
      desc_en TEXT NOT NULL DEFAULT '', desc_az TEXT NOT NULL DEFAULT '', desc_ru TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      base TEXT NOT NULL, width INTEGER NOT NULL, height INTEGER NOT NULL, blur TEXT NOT NULL DEFAULT '',
      alt TEXT NOT NULL DEFAULT '', position INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_pimg ON product_images(product_id, position);
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT, number TEXT NOT NULL UNIQUE,
      user_id INTEGER REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'new', payment_method TEXT NOT NULL, payment_status TEXT NOT NULL DEFAULT 'unpaid',
      subtotal INTEGER NOT NULL, delivery_fee INTEGER NOT NULL DEFAULT 0, total INTEGER NOT NULL, -- qəpik (1 AZN = 100)
      name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, city TEXT NOT NULL, address TEXT NOT NULL, notes TEXT, lang TEXT,
      access_token TEXT, payment_ref TEXT, paid_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL, name TEXT NOT NULL, size TEXT NOT NULL, quantity INTEGER NOT NULL, unit_price INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(order_id);
  `)
  // databases created before card payments existed
  const cols = (d.prepare('PRAGMA table_info(orders)').all() as { name: string }[]).map((c) => c.name)
  for (const col of ['access_token', 'payment_ref', 'paid_at']) if (!cols.includes(col)) d.exec(`ALTER TABLE orders ADD COLUMN ${col} TEXT`)
  seedCatalog(d)
  d.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now())
  return d
}

// ---- tiny typed query helpers (one place for the casts) ----
export const one = <T>(sql: string, ...p: SQLInputValue[]) => db().prepare(sql).get(...p) as T | undefined
export const many = <T>(sql: string, ...p: SQLInputValue[]) => db().prepare(sql).all(...p) as T[]
export const run = (sql: string, ...p: SQLInputValue[]) => db().prepare(sql).run(...p)

/** Runs fn in a write transaction (BEGIN IMMEDIATE serialises concurrent order placement). */
export function tx<T>(fn: () => T): T {
  db().exec('BEGIN IMMEDIATE')
  try { const r = fn(); db().exec('COMMIT'); return r } catch (e) { db().exec('ROLLBACK'); throw e }
}

// ---- row types ----
export interface UserDbRow { id: number; email: string; name: string; phone: string | null; city: string | null; address: string | null; password_hash: string; role: 'customer' | 'admin'; created_at: string }
export interface OrderDbRow {
  id: number; number: string; user_id: number | null; status: string; payment_method: string; payment_status: string
  subtotal: number; delivery_fee: number; total: number; name: string; phone: string; email: string | null; city: string; address: string
  notes: string | null; lang: string | null; access_token: string | null; payment_ref: string | null; paid_at: string | null; created_at: string
}

/** Brand-new database → insert the starter catalogue. Does nothing once any product exists. */
function seedCatalog(d: DatabaseSync) {
  if ((d.prepare('SELECT COUNT(*) n FROM products').get() as { n: number }).n > 0) return
  d.exec('BEGIN')
  try {
    d.exec('DELETE FROM stock')
    const addProduct = d.prepare(`INSERT INTO products (id, slug, name, category, price_q, best_seller, desc_en, desc_az, desc_ru, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))`)
    const addImage = d.prepare('INSERT INTO product_images (product_id, base, width, height, blur, alt, position) VALUES (?, ?, ?, ?, ?, ?, ?)')
    const addStock = d.prepare('INSERT INTO stock (product_id, size, qty) VALUES (?, ?, ?)')
    SEED_PRODUCTS.forEach((p, i) => {
      addProduct.run(p.id, p.slug, p.name, p.category, Math.round(p.price * 100), p.bestSeller ? 1 : 0, p.description.en, p.description.az, p.description.ru, `-${SEED_PRODUCTS.length - i} minutes`)
      p.photos.forEach(([name, alt], pos) => {
        const m = photoMeta[name as PhotoName]
        addImage.run(p.id, `/images/${name}`, m.width, m.height, m.blur, alt, pos)
      })
      for (const [size, qty] of Object.entries(p.stock)) addStock.run(p.id, size, qty)
    })
    d.exec('COMMIT')
  } catch (e) { d.exec('ROLLBACK'); throw e }
}
