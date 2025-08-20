import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    
    // Check password against environment variable
    const correctPassword = process.env.ADMIN_PASSWORD || 'golf2024'
    
    if (password === correctPassword) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
