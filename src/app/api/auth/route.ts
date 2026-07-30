import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  ADMIN_SESSION_COOKIE,
  getAdminPassword,
  isValidSessionToken,
  setSessionCookie
} from '@/lib/session'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required' },
        { status: 400 }
      )
    }

    const correctPassword = getAdminPassword()
    if (!correctPassword) {
      return NextResponse.json(
        {
          success: false,
          error: 'Admin password is not configured. Set ADMIN_PASSWORD in the environment.'
        },
        { status: 503 }
      )
    }

    if (password !== correctPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      )
    }

    const response = NextResponse.json({ success: true })
    await setSessionCookie(response, correctPassword)
    return response
  } catch {
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value
  return NextResponse.json({ authenticated: await isValidSessionToken(token) })
}
