
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/inserat-erstellen'];
  const authPaths = ['/auth'];
  
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  );
  
  const isAuthPath = authPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  );

  // Redirect authenticated users away from auth pages
  if (session && isAuthPath) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Redirect unauthenticated users to auth for protected pages
  if (!session && isProtectedPath) {
    const redirectUrl = new URL('/auth', req.url);
    // Add the original URL as a callback parameter
    redirectUrl.searchParams.set('callback', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/inserat-erstellen/:path*', '/auth'],
};
