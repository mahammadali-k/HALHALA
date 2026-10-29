# HALHALA — streetwear storefront

React + TypeScript + Tailwind frontend with a small Node backend: accounts, orders, stock, card payments, admin panel and a live AI chat.

## Run
```bash
npm install
cp .env.example .env        # then fill it in (see below)
npm run dev                 # frontend + API together
# production
npm run build && npm start  # serves dist/ and /api on PORT (default 8787)
# or with Docker
docker build -t halhala . && docker run -p 8787:8787 -v halhala-data:/data --env-file .env halhala
```
Needs Node 22.13+ (uses the built-in `node:sqlite`). All data lives in one SQLite file, `data/halhala.db` (`DATA_DIR`) — **back it up** and use a persistent disk when hosting.

## Deploy
The site needs a **Node server with a persistent disk** (accounts, orders and stock live in SQLite), so use a host that runs a container or Node process:
- **Render** (easiest): New → Blueprint → select this repo (`render.yaml`). Add the secrets in the dashboard, then set `PUBLIC_URL` to the service URL.
- **Fly.io**: see the comments in `fly.toml`.  **Any VPS**: `docker build` + `docker run` (see *Run* above).
- **Vercel (site) + Render (API)** — the current setup. Render runs this repo (`render.yaml`, service `halhala-az`) and holds the database; Vercel serves the built site and, via `vercel.json`, forwards every `/api/*` request to Render, so the browser sees one domain (no CORS, first-party cookies). Steps:
  1. Render → New → Blueprint → this repo. Set the secrets; **`PUBLIC_URL` = your Vercel domain** (e.g. `https://halhala-store.vercel.app`).
  2. If Render's URL is not `https://halhala-az.onrender.com`, put the real one in `vercel.json` (`rewrites[0].destination`).
  3. Push → Vercel redeploys. Epoint *Result URL*: `<Vercel domain>/api/payments/epoint/callback`.
- Static-only hosting without an API (Vercel alone, Netlify, GitHub Pages) still builds the site, but there are no accounts or online orders — the shop falls back to "send the order via Instagram/TikTok".

Before pushing, make sure everything is tracked: `git add -A && git status` (all of `src/data/` must be listed).

## Setup checklist
| What | Where |
|---|---|
| Admin access | `ADMIN_EMAILS=you@example.com` — register with that email, then open `/admin` |
| New-order alerts | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` |
| Card payments (Epoint) | `PUBLIC_URL`, `EPOINT_PUBLIC_KEY`, `EPOINT_PRIVATE_KEY`; set the merchant cabinet *Result URL* to `<PUBLIC_URL>/api/payments/epoint/callback` |
| Live AI chat | `ANTHROPIC_API_KEY` (optional `CHAT_MODEL`) |
| Contact details & policies | `src/data/site.ts` |
| Products, prices, stock | `src/data/catalog.json` (prices/stock can then be edited live in `/admin → Catalog`); photos in `src/data/images.ts` |

## How it works
- **Accounts** — email + password (scrypt), HttpOnly SameSite=Lax session cookie, rate limits, CSRF header + origin check.
- **Orders** — the server recomputes prices, checks and reserves stock atomically, stores the order, notifies you on Telegram. Pay on delivery or by card.
- **Card payments** — Epoint contract per its developer docs (`data`/`signature`, SHA-1). The bank callback is signature- and amount-verified; if it never arrives the server asks Epoint for the status. Unpaid card orders release their stock after `CARD_HOLD_MINUTES`.
- **Admin `/admin`** — dashboard, orders (search, status flow, mark paid, CSV), users (search, roles, CSV), catalog (prices + stock).
- **Chat** — streams answers from Claude using the real catalogue; order status is looked up by the website itself (order number + phone). Without an API key a built-in assistant answers.
- **Languages** — Azerbaijani, Russian, English (`src/i18n`).

## 360° product view
Product pages open with a slow (≈30 s per turn) rotating viewer: drag, arrow keys or the ‹ › buttons turn it, ❚❚ pauses it, and it stays still for visitors who prefer reduced motion.
- Without turntable images it spins a two-face card (front photo ⇄ back photo = `images[0]` and `images[1]`).
- For a true 360°, add `spin` to the product (`src/data/products.ts`): an ordered list of frame URLs for one full revolution (e.g. 36 or 72 images rendered/photographed on a turntable, `/images/p1/01.webp … 36.webp`). The viewer then steps through the frames at the same slow speed.
