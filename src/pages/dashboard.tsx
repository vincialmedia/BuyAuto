
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/buyauto/dashboard/DashboardLayout";
import OverviewSection from "@/components/buyauto/dashboard/OverviewSection";
import ListingsSection from "@/components/buyauto/dashboard/ListingsSection";
import AccountSection from "@/components/buyauto/dashboard/AccountSection";

type DashboardSection = "overview" | "listings" | "account";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState<DashboardSection>("overview");

  useEffect(() => {
    console.log("Dashboard - user:", user, "loading:", loading);
    
    if (!loading && !user) {
      console.log("No user found, redirecting to auth");
      router.push('/auth');
      return;
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Handle section routing from URL params
    const { section } = router.query;
    if (section === "listings" || section === "account") {
      setCurrentSection(section);
    } else {
      setCurrentSection("overview");
    }
  }, [router.query]);

  // Show loading while auth is being determined
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

  // Redirect if not authenticated
  if (!user) {
    return null; // Will redirect via useEffect
  }

  const renderCurrentSection = () => {
    switch (currentSection) {
      case "listings":
        return <ListingsSection />;
      case "account":
        return <AccountSection />;
      case "overview":
      default:
        return <OverviewSection />;
    }
  };

  const getSectionTitle = () => {
    switch (currentSection) {
      case "listings":
        return "Meine Inserate | BuyAuto Dashboard";
      case "account":
        return "Konto-Einstellungen | BuyAuto Dashboard";
      case "overview":
      default:
        return "Dashboard | BuyAuto";
    }
  };

  const getSectionDescription = () => {
    switch (currentSection) {
      case "listings":
        return "Verwalten Sie Ihre Auto-Leasing-Inserate, bearbeiten Sie Details und verlängern Sie Laufzeiten.";
      case "account":
        return "Verwalten Sie Ihre Konto-Einstellungen, Sicherheit und persönlichen Informationen.";
      case "overview":
      default:
        return "Überblick über Ihre Auto-Leasing-Inserate, Statistiken und schnelle Aktionen.";
    }
  };

  return (
    <>
      <Head>
        <title>{getSectionTitle()}</title>
        <meta name="description" content={getSectionDescription()} />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardLayout currentSection={currentSection}>
        {renderCurrentSection()}
      </DashboardLayout>
    </>
  );
}