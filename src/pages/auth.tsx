
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AuthLayout from "@/components/buyauto/auth/AuthLayout";
import AuthForm from "@/components/buyauto/auth/AuthForm";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthPage() {
  const router = useRouter();
  const { user, loading, isAdmin, adminLoading } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    console.log("Auth page - user:", user, "loading:", loading, "isAdmin:", isAdmin, "adminLoading:", adminLoading, "hasRedirected:", hasRedirected);
    
    // Only redirect if we have a user, auth is not loading, admin check is complete, and we haven't already redirected
    if (user && !loading && !adminLoading && !hasRedirected) {
      console.log("User is authenticated, preparing redirect");
      setHasRedirected(true);
      
      // Check for redirect parameter first, then callback URL
      const redirectParam = router.query.redirect as string;
      const callbackUrl = router.query.callback as string;

      const safeInternalPath = (raw?: string) => {
        if (!raw) return null;
        let decoded = raw;
        try {
          decoded = decodeURIComponent(raw);
        } catch {
          decoded = raw;
        }
        if (!decoded.startsWith("/")) return null;
        if (decoded.startsWith("//")) return null;
        return decoded;
      };

      const safeRedirect = safeInternalPath(redirectParam);
      const safeCallback = safeInternalPath(callbackUrl);

      let redirectUrl = "/dashboard"; // Default for regular users
      
      if (isAdmin) {
        // Admins go to admin dashboard (ignore callback/redirect)
        redirectUrl = "/admin";
        console.log("User is admin, redirecting to admin dashboard");
      } else if (safeRedirect) {
        // Regular users: use redirect parameter if provided (takes priority)
        redirectUrl = safeRedirect;
        console.log("User is regular user with redirect param, redirecting to:", safeRedirect);
      } else if (safeCallback) {
        // Regular users: use callback URL if provided
        redirectUrl = safeCallback;
        console.log("User is regular user with callback, redirecting to:", safeCallback);
      } else {
        // Regular users without callback/redirect: go to dashboard
        console.log("User is regular user without callback/redirect, redirecting to user dashboard");
      }
      
      console.log("Final redirect URL:", redirectUrl);
      
      // Fix: Only navigate if we're not already on the target page
      const currentPath = router.pathname;
      const targetPath = redirectUrl.split("?")[0]; // Get path without query params
      
      if (currentPath !== targetPath) {
        // INSTANT redirect - no delay needed!
        router.push(redirectUrl);
      } else {
        console.log("Already on target page, skipping navigation");
        setHasRedirected(false);
      }
    }
  }, [user, loading, isAdmin, adminLoading, router, hasRedirected]);

  // Show loading state while checking auth/admin status or if we're about to redirect
  if (loading || adminLoading || (user && !hasRedirected)) {
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

  // Don't render form if user is authenticated and we've initiated redirect
  if (user && hasRedirected) {
    return null;
  }

  console.log("Rendering auth form");
  return (
    <AuthLayout>
      <AuthForm />
    </AuthLayout>
  );
}
