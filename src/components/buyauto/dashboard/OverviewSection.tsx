import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardStats, DashboardStats } from "@/services/dashboardService";
import StatsCards from "./StatsCards";

export default function OverviewSection() {
  const [stats, setStats] = useState<DashboardStats>({ active: 0, pending: 0, expired: 0, rejected: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const dashboardStats = await getDashboardStats();
        setStats(dashboardStats);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadStats();
    }
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Guten Morgen";
    if (hour < 18) return "Guten Tag";
    return "Guten Abend";
  };

  const userEmail = user?.email || "Benutzer";
  const firstName = userEmail.split('@')[0];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
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
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              asChild
              size="lg"
              className="bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow-md transition-all"
            >
              <Link href="/inserat-erstellen">
                <Plus className="w-5 h-5 mr-2" />
                Neues Inserat erstellen
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-6">Übersicht</h2>
        <StatsCards stats={stats} isLoading={isLoading} />
      </div>

      {/* Quick Actions */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card className="border-neutral-200/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-neutral-900">
                <Sparkles className="w-5 h-5 mr-2 text-amber-500" />
                Schnellaktionen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.expired > 0 && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-red-700 font-medium mb-2">
                    {stats.expired} abgelaufene Inserate
                  </p>
                  <p className="text-red-600 text-sm mb-3">
                    Verlängern Sie Ihre Inserate, um sie wieder sichtbar zu machen.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="bg-transparent hover:bg-red-50 border-red-200 text-red-600 hover:text-red-700"
                  >
                    <Link href="/dashboard?section=listings">
                      Inserate verwalten
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}

              {stats.pending > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                  <p className="text-amber-700 font-medium mb-2">
                    {stats.pending} ausstehende Freigaben
                  </p>
                  <p className="text-amber-600 text-sm">
                    Diese Inserate werden in Kürze freigeschaltet.
                  </p>
                </div>
              )}

              {stats.total === 0 && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-blue-700 font-medium mb-2">
                    Willkommen bei BuyAuto!
                  </p>
                  <p className="text-blue-600 text-sm mb-3">
                    Erstellen Sie Ihr erstes Inserat und beginnen Sie Ihr Auto zu vermieten.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="bg-transparent hover:bg-blue-50 border-blue-200 text-blue-600 hover:text-blue-700"
                  >
                    <Link href="/inserat-erstellen">
                      Erstes Inserat erstellen
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Overview */}
          <Card className="border-neutral-200/60 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-neutral-900">Ihre Leistung</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-neutral-600">Erfolgsquote</span>
                  <span className="font-semibold text-emerald-600">
                    {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-neutral-600">Aktive Inserate</span>
                  <span className="font-semibold text-neutral-900">{stats.active}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-neutral-600">Warteschlange</span>
                  <span className="font-semibold text-amber-600">{stats.pending}</span>
                </div>
                {stats.total > 0 && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full mt-4 bg-transparent hover:bg-neutral-50 border-neutral-300"
                  >
                    <Link href="/dashboard?section=listings">
                      Alle Inserate anzeigen
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}