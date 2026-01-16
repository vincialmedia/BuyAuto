
import { useEffect } from "react";
import DashboardLayout from "@/components/buyauto/dashboard/DashboardLayout";
import Head from "next/head";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Car, Users, TrendingUp } from "lucide-react";

export default function GarageDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Garage Dashboard - Buy-Auto.ch</title>
      </Head>
      <DashboardLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Garage Dashboard</h1>
            <p className="text-gray-500 mt-2">Verwalten Sie Ihr Inventar und Ihre Anfragen.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktive Fahrzeuge</CardTitle>
                <Car className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">+0 seit letztem Monat</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Anfragen</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">+0 heute</p>
              </CardContent>
            </Card>
            {/* More placeholders for future stats */}
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <h3 className="font-semibold text-lg mb-4">Willkommen im Garage-Bereich</h3>
            <p className="text-gray-600">
              Dies ist Ihr neues Dashboard für professionelle Händler. In Kürze finden Sie hier erweiterte Funktionen für:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
              <li>Massenverwaltung von Inseraten</li>
              <li>Finanzierungsanfragen</li>
              <li>Team-Management</li>
              <li>Performance-Analysen</li>
            </ul>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
