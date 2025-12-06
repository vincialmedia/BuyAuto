import { useEffect, useState } from "react";
import DashboardLayout from "@/components/buyauto/dashboard/DashboardLayout";
import DashboardHeader from "@/components/buyauto/dashboard/DashboardHeader";
import Head from "next/head";
import { useAuth } from "@/contexts/AuthContext";
import UserDetailsSection from "@/components/buyauto/dashboard/UserDetailsSection";
import ListingsSection from "@/components/buyauto/dashboard/ListingsSection";
import OverviewSection from "@/components/buyauto/dashboard/OverviewSection";
import { ListingStatsSection } from "@/components/buyauto/dashboard/ListingStatsSection";
import { useRouter } from "next/router";
import { dashboardService } from "@/services/dashboardService";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [dashboardStats, setDashboardStats] = useState<{
    active: number;
    pending: number;
    sold: number;
    expired: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
      return;
    }

    if (user) {
      loadDashboardStats();
    }
  }, [user, authLoading, router]);

  const loadDashboardStats = async () => {
    try {
      setIsLoading(true);
      const stats = await dashboardService.getStats();
      setDashboardStats(stats);
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
      // Set default stats on error to prevent crash
      setDashboardStats({
        active: 0,
        pending: 0,
        sold: 0,
        expired: 0,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return null;
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
