'use client'
import { useRouter } from 'next/navigation'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '@/lib/api'
import type { User } from '@/types/api'

interface Ctx {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (v: { email: string; password: string; name: string; phone: string }) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (v: Pick<User, 'name' | 'phone' | 'city' | 'address'>) => Promise<void>
}
const C = createContext<Ctx | null>(null)

/** `initialUser` is read from the session cookie on the server, so the header is correct from the first paint. */
export function AuthProvider({ initialUser, children }: { initialUser: User | null; children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState(initialUser)
  useEffect(() => setUser(initialUser), [initialUser])

  const authenticate = useCallback(async (path: string, body: unknown) => {
    setUser((await api<{ user: User }>(path, { method: 'POST', body })).user)
    router.refresh() // Server Components pick up the new session
  }, [router])
  const login = useCallback((email: string, password: string) => authenticate('/api/auth/login', { email, password }), [authenticate])
  const register = useCallback((v: { email: string; password: string; name: string; phone: string }) => authenticate('/api/auth/register', v), [authenticate])
  const logout = useCallback(async () => {
    try { await api('/api/auth/logout', { method: 'POST', body: {} }) } finally { setUser(null); router.refresh() }
  }, [router])
  const updateProfile = useCallback(async (v: Pick<User, 'name' | 'phone' | 'city' | 'address'>) => {
    setUser((await api<{ user: User }>('/api/auth/me', { method: 'PATCH', body: v })).user)
  }, [])

  const value = useMemo(() => ({ user, login, register, logout, updateProfile }), [user, login, register, logout, updateProfile])
  return <C.Provider value={value}>{children}</C.Provider>
}

export function useAuth() {
  const c = useContext(C)
  if (!c) throw new Error('useAuth must be used inside <AuthProvider>')
  return c
}
