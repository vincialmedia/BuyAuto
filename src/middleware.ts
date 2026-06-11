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
    const redirectTarget = encodeURIComponent(`${pathname}${search}`);
    return NextResponse.redirect(new URL(`/auth?redirect=${redirectTarget}`, req.url));
  }

  if (pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = (profile as unknown as { role?: string } | null)?.role;

    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return res;
}

// Auth checks cost a network round-trip to Supabase, so the middleware only
// runs where a session is actually required. Public pages and static assets
// must never pay this tax (it was previously running on every request).
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
