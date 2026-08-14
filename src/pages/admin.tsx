import { useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminLayout } from "@/components/admin/AdminLayout";

export default function AdminPage() {
  const router = useRouter();
  const { user, loading, isAdmin, adminLoading } = useAuth();

  useEffect(() => {
    if (!loading && !adminLoading) {
      if (!user) {
        // Logged out: send to login and come back here after.
        router.replace('/auth?redirect=' + encodeURIComponent('/admin'));
      } else if (!isAdmin) {
        // Logged in without admin rights: home, like the middleware does —
        // /auth would just bounce an authenticated user onwards anyway.
        router.replace('/');
      }
    }
  }, [user, loading, isAdmin, adminLoading, router]);

  // Show loading while checking auth
  if (loading || adminLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mx-auto"></div>
          <p className="text-neutral-600">Zugriff wird überprüft...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not admin (redirect will happen)
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <AdminLayout>
      {/* AdminLayout renders no Head, so without this the tab — and every
          analytics page_title — keeps whatever page the admin arrived from. */}
      <Head>
        <title>Admin – BuyAuto</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminDashboard />
    </AdminLayout>
  );
}