
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardService, type DashboardStats } from "@/services/dashboardService";
import StatsCards from "./StatsCards";

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
        <h2 className="text-2xl font-bold text-neutral-900">Übersicht</h2>
        <Button
          onClick={() => router.push('/inserat-erstellen')}
          className="bg-red-500 hover:bg-red-600 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Neues Inserat erstellen
        </Button>
      </div>

      <StatsCards stats={stats} isLoading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-neutral-200/60 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Inserat hervorheben</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-neutral-600 mb-4">
              Steigern Sie die Sichtbarkeit Ihrer Inserate, um schneller einen passenden Mieter zu finden. Premium-Inserate werden auf der Startseite und in den Suchergebnissen hervorgehoben.
            </p>
          </CardContent>
          <div className="p-6 pt-0">
             <Button 
              variant="outline" 
              onClick={() => router.push('#meine-inserate')}
              className="border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
            >
              Inserat auswählen <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
        
        <Card className="border-neutral-200/60 flex flex-col">
          <CardHeader>
            <CardTitle>Bereit für mehr?</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-neutral-600 mb-4">
              Sie haben mehrere Fahrzeuge zu vermieten? Kontaktieren Sie uns für ein individuelles Angebot und profitieren Sie von unseren Business-Lösungen.
            </p>
          </CardContent>
          <div className="p-6 pt-0">
            <Button variant="outline" onClick={() => router.push('/kontakt')}>
              Kontakt aufnehmen <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
