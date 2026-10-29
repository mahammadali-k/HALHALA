import { NextResponse } from 'next/server'
import { logout } from '@/server/auth'
import { route } from '@/server/http'

export const POST = route(async (req) => {
  const res = NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  logout(req, res)
  return res
})
