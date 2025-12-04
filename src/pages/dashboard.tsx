
import { useEffect } from "react";
import DashboardLayout from "@/components/buyauto/dashboard/DashboardLayout";
import Head from "next/head";
import { useAuth } from "@/contexts/AuthContext";
import UserDetailsSection from "@/components/buyauto/dashboard/UserDetailsSection";
import ListingsSection from "@/components/buyauto/dashboard/ListingsSection";
import OverviewSection from "@/components/buyauto/dashboard/OverviewSection";
import { useRouter } from "next/router";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
        <DashboardLayout>
            <div className="flex justify-center items-center h-screen">
                <p>Wird geladen...</p>
            </div>
        </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Dashboard - Buy-Auto.ch</title>
        <meta name="description" content="Verwalten Sie Ihre Inserate und Ihr Profil auf Buy-Auto.ch." />
      </Head>
      <DashboardLayout>
        <div className="space-y-8" id="dashboard-content">
            <a id="uebersicht" className="scroll-mt-20"></a>
            <OverviewSection />
            
            <a id="benutzerdaten" className="scroll-mt-20"></a>
            <UserDetailsSection />
            
            <a id="meine-inserate" className="scroll-mt-20"></a>
            <ListingsSection />
        </div>
      </DashboardLayout>
    </>
  );
}
