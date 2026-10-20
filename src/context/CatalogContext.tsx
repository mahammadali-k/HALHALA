import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, type Config, type LiveCatalog } from '../lib/api'
import { setLiveCatalog } from '../lib/catalog'

type Backend = 'loading' | 'on' | 'off'
interface Ctx {
  /** 'on' once the API answered. 'off' = static hosting without the server → DM-only ordering. */
  backend: Backend
  config: Config | null
  /** Bumps whenever live stock changes so stock-dependent UI re-renders. */
  version: number
  /** Apply live stock (and prices) from any server response. */
  applyStock: (c: LiveCatalog) => void
  refreshStock: () => Promise<void>
}
const C = createContext<Ctx | null>(null)

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [backend, setBackend] = useState<Backend>('loading')
  const [config, setConfig] = useState<Config | null>(null)
  const [version, setVersion] = useState(0)

  const applyStock = useCallback((c: LiveCatalog) => { setLiveCatalog(c.stock, c.prices); setVersion((v) => v + 1) }, [])
  const refreshStock = useCallback(async () => {
    try { applyStock(await api<LiveCatalog>('/api/stock')) } catch { /* keep last known stock */ }
  }, [applyStock])

  useEffect(() => {
    let alive = true
    api<Config>('/api/config')
      .then((c) => { if (!alive) return; setConfig(c); setBackend('on'); void refreshStock() })
      .catch(() => alive && setBackend('off'))
    return () => { alive = false }
  }, [refreshStock])

  const value = useMemo(() => ({ backend, config, version, applyStock, refreshStock }), [backend, config, version, applyStock, refreshStock])
  return <C.Provider value={value}>{children}</C.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCatalog() {
  const c = useContext(C)
  if (!c) throw new Error('useCatalog must be used inside <CatalogProvider>')
  return c
}
