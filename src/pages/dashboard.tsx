import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardStats, DashboardStats } from "@/services/dashboardService";
import DashboardHeader from "@/components/buyauto/dashboard/DashboardHeader";
import UserDetailsSection from "@/components/buyauto/dashboard/UserDetailsSection";
import ListingStatsSection from "@/components/buyauto/dashboard/ListingStatsSection";
import ListingsSection from "@/components/buyauto/dashboard/ListingsSection";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({ 
    active: 0, 
    pending: 0, 
    expired: 0, 
    rejected: 0, 
    total: 0 
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    console.log("Dashboard - user:", user, "loading:", loading);
    
    if (!loading && !user) {
      console.log("No user found, redirecting to auth");
      router.push('/auth');
      return;
    }
  }, [user, loading, router]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const dashboardStats = await getDashboardStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    if (user) {
      loadStats();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-neutral-600">Dashboard wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Guten Morgen";
    if (hour < 18) return "Guten Tag";
    return "Guten Abend";
  };

  const userEmail = user?.email || "Benutzer";
  const firstName = user?.user_metadata?.first_name || userEmail.split('@')[0];

  return (
    <>
      <Head>
        <title>Dashboard | BuyAuto</title>
        <meta name="description" content="Verwalten Sie Ihre Auto-Leasing-Inserate und Konto-Einstellungen." />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-neutral-50/50">
        <DashboardHeader />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-white to-neutral-50 rounded-2xl border border-neutral-200/60 p-8 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                    {getGreeting()}, {firstName}!
                  </h1>
                  <p className="text-neutral-600 text-lg leading-relaxed">
                    Verwalten Sie Ihre Auto-Leasing-Inserate und behalten Sie den Überblick über Ihre Aktivitäten.
                  </p>
                </div>
                <div>
                  <Button
                    onClick={() => router.push('/inserat-erstellen')}
                    size="lg"
                    className="bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow-md transition-all"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Neues Inserat erstellen
                  </Button>
                </div>
              </div>
            </div>

            {/* Section 1: User Details */}
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Meine Details</h2>
              <UserDetailsSection />
            </div>

            {/* Section 2: Listings Summary (Übersicht) */}
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">Übersicht</h2>
              <ListingStatsSection stats={stats} isLoading={isLoadingStats} />
            </div>

            {/* Section 3: My Listings */}
            <div>
              <ListingsSection />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
