import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const slug = searchParams.get('slug')
  
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug parameter' }, { status: 400 })
  }

  // Set a cookie to enable preview mode
  const response = NextResponse.redirect(new URL(`/blog/${slug}?preview=true`, request.url))
  response.cookies.set('preview-mode', 'true', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 10 // 10 minutes
  })
  
  return response
}
