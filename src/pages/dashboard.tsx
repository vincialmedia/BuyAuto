
import { GetServerSideProps } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";

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
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: "/auth",
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

  // Strict Role-Based Redirect
  if (role === "garage") {
    return {
      redirect: {
        destination: "/dashboard/garage",
        permanent: false,
      },
    };
  } else if (role === "admin") {
     // Optional: Admin dashboard
     return {
      redirect: {
        destination: "/admin", // Or /dashboard/admin if we create it
        permanent: false,
      },
    };
  } else {
    // Default to private dashboard
    return {
      redirect: {
        destination: "/dashboard/private",
        permanent: false,
      },
    };
  }
};
