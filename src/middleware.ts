
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  console.log('Middleware running for:', request.nextUrl.pathname);
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Try to get session with error handling
  let session = null;
  try {
    const { data: { session: sessionData }, error } = await supabase.auth.getSession();
    if (error) {
      console.log('Middleware session error:', error);
    } else {
      session = sessionData;
    }
  } catch (error) {
    console.log('Middleware session fetch error:', error);
  }

  console.log('Middleware session check:', !!session);

  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/inserat-erstellen'];
  const authPaths = ['/auth'];
  
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );
  
  const isAuthPath = authPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  // Only redirect away from auth if we have a CONFIRMED session
  if (session && session.user && isAuthPath) {
    console.log('Redirecting authenticated user from auth to dashboard');
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Only redirect to auth for protected paths if we're SURE there's no session
  if (!session && isProtectedPath) {
    console.log('Redirecting unauthenticated user to auth');
    const redirectUrl = new URL('/auth', request.url);
    // Add the original URL as a callback parameter
    redirectUrl.searchParams.set('callback', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  console.log('Middleware allowing request to proceed');
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/inserat-erstellen/:path*', '/auth'],
};