
import { GetServerSideProps } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { localizePath, toLocale } from "@/i18n/config";

/**
 * Main Dashboard Entry Point (Router)
 * This page performs a server-side check of the user's role and redirects
 * to the appropriate dashboard view (/dashboard/private or /dashboard/garage).
 */
export default function DashboardRouter() {
  return null; // This component never renders because of the redirect
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = createPagesServerClient(ctx);
  // GSSP redirects are not locale-prefixed by Next — keep /fr, /it, /en.
  const locale = toLocale(ctx.locale);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: localizePath("/auth", locale),
        permanent: false,
      },
    };
  }

  // Fetch the user's profile to get the role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  const role = profile?.role || "private";

  // Strict Role-Based Redirect. Admins land on the private dashboard too:
  // the admin panel is reachable via its own "Admin" menu entry, and admins
  // need the regular seller view to manage their own (test) listings.
  if (role === "garage") {
    return {
      redirect: {
        destination: localizePath("/dashboard/garage", locale),
        permanent: false,
      },
    };
  } else {
    return {
      redirect: {
        destination: localizePath("/dashboard/private", locale),
        permanent: false,
      },
    };
  }
};
