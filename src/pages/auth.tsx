
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AuthLayout from "@/components/buyauto/auth/AuthLayout";
import AuthForm from "@/components/buyauto/auth/AuthForm";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    console.log("Auth page - user:", user, "loading:", loading, "redirecting:", redirecting);
    
    // Redirect authenticated users to dashboard
    if (user && !loading && !redirecting) {
      console.log("User is authenticated, redirecting to dashboard");
      setRedirecting(true);
      
      // Use replace to avoid history issues
      const callbackUrl = router.query.callback as string || "/dashboard";
      router.replace(callbackUrl);
    }
  }, [user, loading, router, redirecting]);

  // Show loading state while checking auth or redirecting
  if (loading || redirecting) {
    console.log("Auth loading state - loading:", loading, "redirecting:", redirecting);
    return (
      <AuthLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto"></div>
            <p className="text-neutral-600 text-sm">
              {redirecting ? "Weiterleitung..." : "Wird geladen..."}
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Don't render form if user is authenticated (will redirect)
  if (user) {
    console.log("User exists, should redirect");
    return null;
  }

  console.log("Rendering auth form");
  return (
    <AuthLayout>
      <AuthForm />
    </AuthLayout>
  );
}