import { NextRequest, NextResponse } from 'next/server'

export const ADMIN_SESSION_COOKIE = 'golf_admin_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export function getAdminPassword(): string | null {
  const password = process.env.ADMIN_PASSWORD
  if (!password || password.trim() === '' || password === 'your_secure_password_here') {
    return null
  }
  return password
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

export async function createSessionToken(password: string): Promise<string> {
  return sha256Hex(`golf-trip-admin:${password}`)
}

export async function isValidSessionToken(token: string | undefined | null): Promise<boolean> {
  const password = getAdminPassword()
  if (!password || !token) return false
  const expected = await createSessionToken(password)
  return timingSafeEqual(token, expected)
}

export function getSessionTokenFromRequest(request: NextRequest): string | undefined {
  return request.cookies.get(ADMIN_SESSION_COOKIE)?.value
}

export async function isAuthenticatedRequest(request: NextRequest): Promise<boolean> {
  return isValidSessionToken(getSessionTokenFromRequest(request))
}

export async function setSessionCookie(response: NextResponse, password: string): Promise<void> {
  const token = await createSessionToken(password)
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE
  })
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0
  })
}
