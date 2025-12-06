import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // 1. CANONICAL DOMAIN ENFORCEMENT (One Hop Redirect)
  // Only enforce in production to preserve localhost development
  const hostname = req.nextUrl.hostname
  const protocol = req.nextUrl.protocol
  const isProduction = process.env.NODE_ENV === 'production'
  
  // If in production and not already on canonical domain, redirect
  if (isProduction && hostname !== 'www.buyauto.ch') {
    const canonicalUrl = new URL(req.nextUrl.pathname + req.nextUrl.search, 'https://www.buyauto.ch')
    return NextResponse.redirect(canonicalUrl, 301)
  }
  
  // If in production and using http (though Vercel should handle this), ensure https
  if (isProduction && protocol === 'http:') {
    const httpsUrl = new URL(req.nextUrl.pathname + req.nextUrl.search, `https://${hostname}`)
    return NextResponse.redirect(httpsUrl, 301)
  }

  // 2. SUPABASE AUTH SESSION MANAGEMENT
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - this ensures API routes can access updated session
  const { data: { user } } = await supabase.auth.getUser()
  
  // 3. PROTECTED ROUTES - Protect the listing creation page
  if (req.nextUrl.pathname === '/inserat-erstellen') {
    if (!user) {
      // Redirect to auth page with redirect parameter
      const redirectUrl = new URL('/auth', req.url)
      redirectUrl.searchParams.set('redirect', '/inserat-erstellen')
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  // 4. SECURITY HEADERS
  response.headers.set('X-Content-Type-Options', 'nosniff')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}