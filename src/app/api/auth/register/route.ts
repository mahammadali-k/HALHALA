import { NextResponse } from 'next/server'
import { register } from '@/server/auth'
import { route } from '@/server/http'

export const POST = route(async (req) => {
  const res = NextResponse.json({}, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  const user = await register(req, res)
  return NextResponse.json({ user }, { status: 201, headers: res.headers }) // keeps the Set-Cookie header
})
