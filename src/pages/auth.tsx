import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AuthLayout from "@/components/buyauto/auth/AuthLayout";
import AuthForm from "@/components/buyauto/auth/AuthForm";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

function safeInternalPath(raw?: string | string[] | null): string | null {
  if (!raw || Array.isArray(raw)) return null;
  let decoded = raw;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    decoded = raw;
  }
  if (!decoded.startsWith("/")) return null;
  if (decoded.startsWith("//")) return null;
  // Backslashes and C0 control chars (tab/newline/CR) are stripped or
  // normalized by WHATWG URL parsing, so "/%09/evil.com" would resolve to
  // an external origin ("//evil.com") despite passing the checks above.
  if (/[\\\u0000-\u001F]/.test(decoded)) return null;
  return decoded;
}

export default function AuthPage() {
  const router = useRouter();
  const { user, loading, isAdmin, adminLoading } = useAuth();
  const [isRecovery, setIsRecovery] = useState(false);
  const [hashChecked, setHashChecked] = useState(false);

  // Listen directly to Supabase for the recovery event (most reliable for PKCE)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log("Auth event:", event);
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Check the URL hash and path immediately to see if this is a password recovery redirect from Supabase
  useEffect(() => {
    if (!router.isReady) return;
    
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      const search = window.location.search;
      const asPath = router.asPath; // Next.js original path before any history.replaceState
      
      if (
        hash.includes("type=recovery") || 
        hash.includes("recovery") ||
        search.includes("type=recovery") ||
        search.includes("reset=true") ||
        search.includes("code=") ||
        asPath.includes("type=recovery") ||
        asPath.includes("reset=true") ||
        asPath.includes("code=") ||
        router.query.type === "recovery" ||
        router.query.reset === "true"
      ) {
        setIsRecovery(true);
      }
      setHashChecked(true);
    }
  }, [router.isReady, router.asPath, router.query]);

  useEffect(() => {
    if (!router.isReady || !hashChecked) return;
    if (!user || loading || adminLoading) return;

    // CRITICAL: If the user is logging in via a password reset email, they are instantly
    // given a "recovery" session. We MUST NOT redirect them to the dashboard yet.
    if (isRecovery) return;

    const redirectParam = safeInternalPath(router.query.redirect ?? null);

    // An explicit ?redirect= wins for everyone — an admin re-authenticating
    // mid-flow should return where they were, not be forced into /admin.
    const redirectUrl = redirectParam ?? (isAdmin ? "/admin" : "/dashboard");

    const currentPath = router.pathname;
    const targetPath = redirectUrl.split("?")[0];

    if (currentPath !== targetPath) {
      void router.replace(redirectUrl);
    }
  }, [router, user, loading, isAdmin, adminLoading, hashChecked, isRecovery]);

  // Show loading spinner if checking auth state, or if they are logged in but we are about to redirect them
  if (!hashChecked || loading || adminLoading || (user && !isRecovery)) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="text-neutral-600 text-sm">
              {user && !isRecovery ? "Weiterleitung..." : "Wird geladen..."}
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // ?view=register (and optionally ?type=garage) lets a link land straight on the
  // registration tab with the account type preselected — used by the calculator's
  // "signup for more searches" CTA.
  const viewParam = Array.isArray(router.query.view) ? router.query.view[0] : router.query.view;
  const typeParam = Array.isArray(router.query.type) ? router.query.type[0] : router.query.type;
  const initialView = isRecovery
    ? "update-password"
    : viewParam === "register"
      ? "register"
      : "login";
  const initialAccountType =
    typeParam === "garage" || typeParam === "dealer" ? "garage" : undefined;

  return (
    <AuthLayout>
      <AuthForm initialView={initialView} initialAccountType={initialAccountType} />
    </AuthLayout>
  );
}