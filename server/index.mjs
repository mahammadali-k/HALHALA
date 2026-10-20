// Production server: serves the built site (dist/) and the live chat API on one port.
//   npm run build && npm start      (set ANTHROPIC_API_KEY in the environment or .env)
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { handleApi } from './api.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
const port = Number(process.env.PORT) || 8787
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.ico': 'image/x-icon' }

const SECURITY = {
  'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  ...(process.env.PUBLIC_URL?.startsWith('https') ? { 'Strict-Transport-Security': 'max-age=31536000' } : {}),
}
const compressible = new Set(['.html', '.js', '.css', '.svg', '.json'])
const gzCache = new Map() // path -> gzipped buffer (built assets are immutable per deploy)

async function serveStatic(req, res) {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0])
  let file = path.join(root, path.normalize(url))
  if (!file.startsWith(root)) { res.writeHead(403); return res.end() }
  try { if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html') } catch { file = path.join(root, 'index.html') } // SPA fallback
  try {
    const ext = path.extname(file)
    const immutable = file.includes(`${path.sep}assets${path.sep}`) || file.includes(`${path.sep}images${path.sep}`)
    const headers = { 'Content-Type': types[ext] ?? 'application/octet-stream', 'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache', ...SECURITY }
    let body = await readFile(file)
    if (compressible.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '')) {
      if (!gzCache.has(file)) gzCache.set(file, gzipSync(body))
      body = gzCache.get(file); headers['Content-Encoding'] = 'gzip'; headers.Vary = 'Accept-Encoding'
    }
    res.writeHead(200, headers)
    res.end(body)
  } catch { res.writeHead(404); res.end('Not found') }
}

createServer((req, res) => {
  if ((req.url ?? '').startsWith('/api/')) { for (const [k, v] of Object.entries(SECURITY)) res.setHeader(k, v); return handleApi(req, res) }
  return serveStatic(req, res)
}).listen(port, () => console.log(`HALHALA on http://localhost:${port}  (AI chat: ${process.env.ANTHROPIC_API_KEY ? 'on' : 'off — set ANTHROPIC_API_KEY'})`))
