import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCards } from "@/components/buyauto/dashboard/StatsCards";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardService, type DashboardStats } from "@/services/dashboardService";

export default function OverviewSection() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await dashboardService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user, loadStats]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Übersicht</h2>
      </div>

      <StatsCards stats={stats} isLoading={loading} />
    </div>
  );
}