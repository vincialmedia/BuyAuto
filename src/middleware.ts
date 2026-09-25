import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/integrations/supabase/types";

// Two language prefixes (/de/fr, /fr/en/preise) make Next's router throw a
// 500 ("detected locale does not match"); answer them with a plain 404, as
// before i18n. nextUrl.pathname already has the first prefix stripped.
const SECOND_LOCALE_PREFIX = /^\/(de|fr|it|en)(\/|$)/;

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (SECOND_LOCALE_PREFIX.test(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

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
//
// The last entry (locale: false, matched against the raw path) only fires for
// URLs with two language prefixes and never reaches the auth check.
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    { source: "/:first(de|fr|it|en)/:second(de|fr|it|en)/:path*", locale: false },
  ],
};
