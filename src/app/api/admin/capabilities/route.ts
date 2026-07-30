import { NextResponse } from 'next/server'

export async function GET() {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return NextResponse.json({
    canEdit: isDevelopment,
    mode: isDevelopment ? 'development' : 'production'
  })
}
