
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AuthLayout from "@/components/buyauto/auth/AuthLayout";
import AuthForm from "@/components/buyauto/auth/AuthForm";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    console.log("Auth page - user:", user, "loading:", loading, "hasRedirected:", hasRedirected);
    
    // Only redirect if we have a user, auth is not loading, and we haven't already redirected
    if (user && !loading && !hasRedirected) {
      console.log("User is authenticated, initiating redirect to dashboard");
      setHasRedirected(true);
      
      // Get callback URL from query params or default to dashboard
      const callbackUrl = (router.query.callback as string) || "/dashboard";
      console.log("Redirecting to:", callbackUrl);
      
      // Use window.location.href for a clean redirect that refreshes the page state
      // This ensures the middleware and auth state are properly synchronized
      setTimeout(() => {
        window.location.href = callbackUrl;
      }, 500); // Small delay to ensure auth state is fully updated
    }
  }, [user, loading, router.query.callback, hasRedirected]);

  // Show loading state while checking auth or if we're about to redirect
  if (loading || (user && !hasRedirected)) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="text-neutral-600 text-sm">
              {user ? "Weiterleitung zum Dashboard..." : "Wird geladen..."}
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