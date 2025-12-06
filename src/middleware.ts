import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
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
  
  // Protect the listing creation page - only authenticated users can access it
  if (req.nextUrl.pathname === '/inserat-erstellen') {
    if (!user) {
      // Redirect to auth page with redirect parameter
      const redirectUrl = new URL('/auth', req.url)
      redirectUrl.searchParams.set('redirect', '/inserat-erstellen')
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  // Apply security headers (Migration from vercel.json for CVE-2025-55182)
  // We apply this to the final response object to ensure it persists even if the response was recreated by Supabase auth
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Log for debugging
  console.log(`Middleware: Session refresh for ${req.nextUrl.pathname}. User is ${user ? 'authenticated' : 'not authenticated'}.`)

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