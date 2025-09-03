
import { useEffect } from "react";
import { useRouter } from "next/router";
import AuthLayout from "@/components/buyauto/auth/AuthLayout";
import AuthForm from "@/components/buyauto/auth/AuthForm";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log("Auth page - user:", user, "loading:", loading);
    
    // Redirect authenticated users to dashboard
    if (user && !loading) {
      console.log("User is authenticated, redirecting to dashboard");
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    console.log("Auth loading state");
    return (
      <AuthLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
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