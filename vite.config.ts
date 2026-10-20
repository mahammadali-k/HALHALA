import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/** Mounts the API (auth, orders, stock, live chat) into `vite dev` and `vite preview` so one command runs everything. */
function chatApi(mode: string): Plugin {
  const mount = async (app: { use: (path: string, fn: (req: never, res: never) => void) => void }) => {
    const env = loadEnv(mode, process.cwd(), '')
    for (const [k, v] of Object.entries(env)) if (!k.startsWith('VITE_') && process.env[k] === undefined) process.env[k] = v
    const { handleApi } = await import('./server/api.mjs')
    app.use('/api', (req, res) => { void handleApi(req, res) })
  }
  return {
    name: 'halhala-chat-api',
    configureServer: (s) => mount(s.middlewares as never),
    configurePreviewServer: (s) => mount(s.middlewares as never),
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), chatApi(mode)],
}))
