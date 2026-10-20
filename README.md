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
