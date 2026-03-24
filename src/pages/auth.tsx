import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AuthLayout from "@/components/buyauto/auth/AuthLayout";
import AuthForm from "@/components/buyauto/auth/AuthForm";
import { useAuth } from "@/contexts/AuthContext";

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
  return decoded;
}

export default function AuthPage() {
  const router = useRouter();
  const { user, loading, isAdmin, adminLoading } = useAuth();
  const [isRecovery, setIsRecovery] = useState(false);
  const [hashChecked, setHashChecked] = useState(false);

  // Check the URL hash immediately to see if this is a password recovery redirect from Supabase
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash;
      if (hash.includes("type=recovery") || hash.includes("recovery")) {
        setIsRecovery(true);
      }
      setHashChecked(true);
    }
  }, []);

  useEffect(() => {
    if (!router.isReady || !hashChecked) return;
    if (!user || loading || adminLoading) return;

    // CRITICAL: If the user is logging in via a password reset email, they are instantly
    // given a "recovery" session. We MUST NOT redirect them to the dashboard yet.
    if (isRecovery) return;

    const redirectParam = safeInternalPath(router.query.redirect ?? null);

    const redirectUrl = isAdmin ? "/admin" : redirectParam ?? "/dashboard";

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

  return (
    <AuthLayout>
      <AuthForm initialView={isRecovery ? "update-password" : "login"} />
    </AuthLayout>
  );
}