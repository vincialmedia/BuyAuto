import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { ModerationView } from "@/components/admin/ModerationView";
import { AllListingsView } from "@/components/admin/AllListingsView";
import { UsersView } from "@/components/admin/UsersView";
import { DraftsView } from "@/components/admin/DraftsView";
import { adminService } from "@/services/adminService";
import type { AdminStats } from "@/services/adminService";
import { Card } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle, Archive } from "lucide-react";

export function AdminDashboard() {
  const router = useRouter();
  const { tab } = router.query;
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const data = await adminService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const renderContent = () => {
    switch (tab) {
      case 'listings':
        return <AllListingsView onStatsUpdate={loadStats} />;
      case 'drafts':
        return <DraftsView />;
      case 'users':
        return <UsersView />;
      case 'inquiries':
        return (
          <div className="text-center py-12">
            <p className="text-neutral-600">Anfragen-Verwaltung kommt bald...</p>
          </div>
        );
      default:
        return <ModerationView onStatsUpdate={loadStats} />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards - Only show for listings-related tabs */}
      {(!tab || tab === 'listings') && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <StatsCard
            icon={Clock}
            label="Warteschlange"
            value={stats?.pending || 0}
            loading={statsLoading}
            className="bg-amber-50 border-amber-200"
            iconClassName="text-amber-600"
          />
          <StatsCard
            icon={CheckCircle}
            label="Freigegeben"
            value={stats?.published || 0}
            loading={statsLoading}
            className="bg-emerald-50 border-emerald-200"
            iconClassName="text-emerald-600"
          />
          <StatsCard
            icon={XCircle}
            label="Abgelehnt"
            value={stats?.rejected || 0}
            loading={statsLoading}
            className="bg-red-50 border-red-200"
            iconClassName="text-red-600"
          />
          <StatsCard
            icon={Archive}
            label="Abgelaufen"
            value={stats?.expired || 0}
            loading={statsLoading}
            className="bg-neutral-50 border-neutral-200"
            iconClassName="text-neutral-600"
          />
        </div>
      )}

      {/* Main Content */}
      {renderContent()}
    </div>
  );
}

interface StatsCardProps {
  icon: React.ComponentType<any>;
  label: string;
  value: number;
  loading?: boolean;
  className?: string;
  iconClassName?: string;
}

function StatsCard({ 
  icon: Icon, 
  label, 
  value, 
  loading, 
  className = "", 
  iconClassName = "" 
}: StatsCardProps) {
  return (
    <Card className={`p-4 sm:p-6 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-neutral-600 mb-1 truncate">{label}</p>
          {loading ? (
            <div className="h-8 w-12 bg-neutral-200 animate-pulse rounded"></div>
          ) : (
            <p className="text-2xl font-semibold text-neutral-900">{value}</p>
          )}
        </div>
        <Icon className={`w-6 h-6 sm:w-8 sm:h-8 flex-none ${iconClassName}`} />
      </div>
    </Card>
  );
}
