import { NextResponse } from 'next/server'
import { login } from '@/server/auth'
import { route } from '@/server/http'

export const POST = route(async (req) => {
  const res = NextResponse.json({}, { headers: { 'Cache-Control': 'no-store' } })
  const user = await login(req, res)
  return NextResponse.json({ user }, { headers: res.headers })
})
