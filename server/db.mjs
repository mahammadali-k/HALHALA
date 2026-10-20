// SQLite via Node's built-in node:sqlite (no native build step). One file, WAL mode.
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
export const catalog = JSON.parse(readFileSync(path.join(here, '../src/data/catalog.json'), 'utf8'))

const dir = process.env.DATA_DIR || path.join(here, '../data')
mkdirSync(dir, { recursive: true })
export const db = new DatabaseSync(path.join(dir, 'halhala.db'))

db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT, city TEXT, address TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS stock (
  product_id TEXT NOT NULL, size TEXT NOT NULL,
  qty INTEGER NOT NULL CHECK (qty >= 0),
  PRIMARY KEY (product_id, size)
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  number TEXT NOT NULL UNIQUE,
  user_id INTEGER REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'new',
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  subtotal INTEGER NOT NULL, delivery_fee INTEGER NOT NULL DEFAULT 0, total INTEGER NOT NULL, -- qəpik (1 AZN = 100)
  name TEXT NOT NULL, phone TEXT NOT NULL, email TEXT, city TEXT NOT NULL, address TEXT NOT NULL, notes TEXT, lang TEXT,
  access_token TEXT, payment_ref TEXT, paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS price_overrides (product_id TEXT PRIMARY KEY, price_q INTEGER NOT NULL CHECK (price_q >= 0));
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL, name TEXT NOT NULL, size TEXT NOT NULL,
  quantity INTEGER NOT NULL, unit_price INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_items_order ON order_items(order_id);
`)

// Migrate databases created before card payments existed.
const orderCols = db.prepare('PRAGMA table_info(orders)').all().map((c) => c.name)
for (const [name, type] of [['access_token', 'TEXT'], ['payment_ref', 'TEXT'], ['paid_at', 'TEXT']]) {
  if (!orderCols.includes(name)) db.exec(`ALTER TABLE orders ADD COLUMN ${name} ${type}`)
}

// Seed stock from the catalogue for any product/size not yet tracked (existing counts are never overwritten).
const seed = db.prepare('INSERT OR IGNORE INTO stock (product_id, size, qty) VALUES (?, ?, ?)')
for (const p of catalog) for (const [size, qty] of Object.entries(p.stock)) seed.run(p.id, size, qty)
db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now())

/** Run fn inside a write transaction (BEGIN IMMEDIATE serialises concurrent order placement). */
export function tx(fn) {
  db.exec('BEGIN IMMEDIATE')
  try { const r = fn(); db.exec('COMMIT'); return r } catch (e) { db.exec('ROLLBACK'); throw e }
}
