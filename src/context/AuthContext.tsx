import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, type User } from '../lib/api'
import { useCatalog } from './CatalogContext'

interface Ctx {
  user: User | null
  /** False until the first /me answer (so pages don't flash the logged-out state). */
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  register: (v: { email: string; password: string; name: string; phone: string }) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (v: Pick<User, 'name' | 'phone' | 'city' | 'address'>) => Promise<void>
}
const C = createContext<Ctx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { backend } = useCatalog()
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (backend === 'loading') return
    if (backend === 'off') { setReady(true); return }
    api<{ user: User | null }>('/api/auth/me').then((r) => setUser(r.user)).catch(() => setUser(null)).finally(() => setReady(true))
  }, [backend])

  const login = useCallback(async (email: string, password: string) => { setUser((await api<{ user: User }>('/api/auth/login', { method: 'POST', body: { email, password } })).user) }, [])
  const register = useCallback(async (v: { email: string; password: string; name: string; phone: string }) => { setUser((await api<{ user: User }>('/api/auth/register', { method: 'POST', body: v })).user) }, [])
  const logout = useCallback(async () => { try { await api('/api/auth/logout', { method: 'POST', body: {} }) } finally { setUser(null) } }, [])
  const updateProfile = useCallback(async (v: Pick<User, 'name' | 'phone' | 'city' | 'address'>) => { setUser((await api<{ user: User }>('/api/auth/me', { method: 'PATCH', body: v })).user) }, [])

  const value = useMemo(() => ({ user, ready, login, register, logout, updateProfile }), [user, ready, login, register, logout, updateProfile])
  return <C.Provider value={value}>{children}</C.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const c = useContext(C)
  if (!c) throw new Error('useAuth must be used inside <AuthProvider>')
  return c
}
