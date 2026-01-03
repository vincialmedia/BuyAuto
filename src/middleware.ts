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

  // 2. SEO CONSOLIDATION REDIRECTS (301 Permanent)
  // Redirect /leasing-transfer to /leasinguebernahme to consolidate SEO authority
  const pathname = req.nextUrl.pathname
  
  if (pathname === '/leasing-transfer' || pathname === '/leasing-transfer/') {
    const consolidatedUrl = new URL('/leasinguebernahme', req.url)
    // Preserve query parameters (e.g., ?utm_source=google)
    consolidatedUrl.search = req.nextUrl.search
    return NextResponse.redirect(consolidatedUrl, 301)
  }

  // 3. SUPABASE AUTH SESSION MANAGEMENT
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
  await supabase.auth.getUser()
  
  // 4. PROTECTED ROUTES - Removed /inserat-erstellen protection to allow guest access
  // Authentication will be handled within the wizard flow before payment
  
  // 5. SECURITY HEADERS
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