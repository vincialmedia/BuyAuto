import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired - important for Server-Side Rendering
  const { data: { session } } = await supabase.auth.getSession();
  console.log(`Middleware: Session check for ${req.nextUrl.pathname}. User is ${session ? 'authenticated' : 'not authenticated'}.`);

  // Define protected routes
  const protectedPaths = ['/dashboard', '/inserat-erstellen'];
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path));

  // If user is not signed in and is trying to access a protected route, redirect to auth page
  if (!session && isProtectedPath) {
    console.log(`Middleware: Redirecting unauthenticated user to /auth.`);
    const redirectUrl = new URL('/auth', req.url);
    redirectUrl.searchParams.set('callback', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If user is signed in and tries to access the auth page, redirect to dashboard
  if (session && req.nextUrl.pathname.startsWith('/auth')) {
    console.log(`Middleware: Redirecting authenticated user to /dashboard.`);
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};