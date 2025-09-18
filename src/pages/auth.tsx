
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
      console.log("User is authenticated, checking admin status for redirect");
      setHasRedirected(true);
      
      // Check for callback URL in query params first
      const callbackUrl = router.query.callback as string;
      let redirectUrl = "/dashboard"; // Default for regular users
      
      if (isAdmin) {
        // Admins go to admin dashboard (ignore callback)
        redirectUrl = "/admin";
        console.log("User is admin, redirecting to admin dashboard");
      } else if (callbackUrl) {
        // Regular users: use callback URL if provided
        redirectUrl = callbackUrl;
        console.log("User is regular user with callback, redirecting to:", callbackUrl);
      } else {
        // Regular users without callback: go to dashboard
        console.log("User is regular user without callback, redirecting to user dashboard");
      }
      
      console.log("Final redirect URL:", redirectUrl);
      
      // Use router.push with delay to ensure session is synced
      setTimeout(() => {
        router.push(redirectUrl);
      }, 1500);
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