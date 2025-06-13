import { NextResponse } from 'next/server'

export async function GET() {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const config = {
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    clientIdFormat: process.env.GOOGLE_CLIENT_ID?.endsWith('.apps.googleusercontent.com') || false,
    clientIdLength: process.env.GOOGLE_CLIENT_ID?.length || 0,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    clientSecretLength: process.env.GOOGLE_CLIENT_SECRET?.length || 0,
    nextAuthUrl: process.env.NEXTAUTH_URL || 'not set',
    hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    callbackUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/callback/google`,
  }

  return NextResponse.json(config)
}