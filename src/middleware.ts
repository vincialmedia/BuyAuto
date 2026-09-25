import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/integrations/supabase/types";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // With i18n routing, req.nextUrl.pathname has the locale stripped; cloning
    // nextUrl keeps the visitor's language (/fr/dashboard → /fr/auth). German
    // stays unprefixed, exactly as before.
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/auth";
    loginUrl.search = `?redirect=${encodeURIComponent(`${pathname}${search}`)}`;
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = (profile as unknown as { role?: string } | null)?.role;

    if (role !== "admin") {
      const homeUrl = req.nextUrl.clone();
      homeUrl.pathname = "/";
      homeUrl.search = "";
      return NextResponse.redirect(homeUrl);
    }
  }

  return res;
}

// Auth checks cost a network round-trip to Supabase, so the middleware only
// runs where a session is actually required. Public pages and static assets
// must never pay this tax (it was previously running on every request).
// With i18n configured, Next matches these paths in every locale
// (/dashboard and /fr/dashboard alike).
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
