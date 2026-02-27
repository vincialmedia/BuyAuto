import { useEffect } from "react";
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

  useEffect(() => {
    if (!router.isReady) return;
    if (!user || loading || adminLoading) return;

    const redirectParam = safeInternalPath(router.query.redirect ?? null);

    const redirectUrl = isAdmin ? "/admin" : redirectParam ?? "/dashboard";

    const currentPath = router.pathname;
    const targetPath = redirectUrl.split("?")[0];

    if (currentPath !== targetPath) {
      void router.replace(redirectUrl);
    }
  }, [router, user, loading, isAdmin, adminLoading]);

  if (loading || adminLoading || user) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="text-neutral-600 text-sm">
              {user ? "Weiterleitung..." : "Wird geladen..."}
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <AuthForm />
    </AuthLayout>
  );
}
