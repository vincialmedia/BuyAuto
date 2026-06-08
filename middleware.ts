import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/integrations/supabase/types";

const RESERVED_ROOT_SLUGS = new Set([
  "api",
  "auth",
  "admin",
  "dashboard",
  "suche",
  "fahrzeug",
  "inserat-erstellen",
  "billing",
  "agb",
  "datenschutz",
  "sitemap.xml",
  "robots.txt",
]);

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const rootSegment = pathname.split("/").filter(Boolean)[0];

  if (rootSegment && RESERVED_ROOT_SLUGS.has(rootSegment)) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isAdminRoute = pathname.startsWith("/admin");
  const isEmbedRoute = pathname.startsWith("/embed/");

  if (!isEmbedRoute && !user && (isDashboardRoute || isAdminRoute)) {
    const redirectTarget = encodeURIComponent(`${pathname}${search}`);
    return NextResponse.redirect(new URL(`/auth?redirect=${redirectTarget}`, req.url));
  }

  if (user && isAdminRoute) {
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

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};