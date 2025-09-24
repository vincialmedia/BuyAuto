import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res });

  // Refresh session if expired - this is the key part for API routes to work
  const { data: { session } } = await supabase.auth.getSession();
  
  // Log for debugging
  console.log(`Middleware: Session refresh for ${req.nextUrl.pathname}. User is ${session ? 'authenticated' : 'not authenticated'}.`);

  // Don't do any redirects - let the client-side routing handle auth flow
  // Just ensure the session is refreshed so API routes can access it
  return res;
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
};
