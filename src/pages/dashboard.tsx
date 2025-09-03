
import { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion } from "framer-motion";
import { LogOut, User, Plus, BarChart3, Settings } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import authService from "@/services/authService";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Redirect unauthenticated users to auth
    if (!user && !loading) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      toast.success("Erfolgreich abgemeldet!");
      router.push("/auth");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Fehler beim Abmelden");
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  // Don't render dashboard if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  const firstName = user.user_metadata?.first_name;
  const lastName = user.user_metadata?.last_name;
  const displayName = firstName || lastName 
    ? `${firstName || ''} ${lastName || ''}`.trim()
    : user.email?.split('@')[0] || 'Benutzer';

  return (
    <>
      <Head>
        <title>Dashboard | BuyAuto</title>
        <meta name="description" content="Verwalten Sie Ihre Auto-Leasing-Inserate bei BuyAuto" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-white">
        {/* Header */}
        <header className="border-b border-neutral-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md shadow-red-500/25">
                  <span className="text-white font-bold text-sm">BA</span>
                </div>
                <span className="text-xl font-bold text-neutral-900 tracking-tight">
                  BuyAuto
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 text-sm text-neutral-600">
                  <User className="h-4 w-4" />
                  <span>{displayName}</span>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  size="sm"
                  className="bg-transparent hover:bg-red-50 border-neutral-300 hover:border-red-300 hover:text-red-600 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Abmelden
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                Willkommen zurück, {firstName || 'zurück'}!
              </h1>
              <p className="text-neutral-600">
                Verwalten Sie Ihre Auto-Leasing-Inserate und verfolgen Sie deren Performance.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-neutral-200/60 shadow-lg shadow-neutral-900/5 hover:shadow-xl hover:shadow-neutral-900/10 transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <Plus className="h-5 w-5 mr-2 text-red-500" />
                      Neues Inserat
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-600 text-sm mb-4">
                      Erstellen Sie ein neues Auto-Leasing-Inserat und erreichen Sie potentielle Käufer.
                    </p>
                    <Button 
                      className="w-full bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300"
                      onClick={() => router.push("/inserat-erstellen")}
                    >
                      Inserat erstellen
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-neutral-200/60 shadow-lg shadow-neutral-900/5 hover:shadow-xl hover:shadow-neutral-900/10 transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                      Meine Inserate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-600 text-sm mb-4">
                      Übersicht über alle Ihre aktiven und abgelaufenen Inserate.
                    </p>
                    <Button 
                      variant="outline"
                      className="w-full bg-transparent hover:bg-blue-50 border-neutral-300 hover:border-blue-300 hover:text-blue-600 transition-colors"
                    >
                      Inserate verwalten
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="bg-white/80 backdrop-blur-sm border-neutral-200/60 shadow-lg shadow-neutral-900/5 hover:shadow-xl hover:shadow-neutral-900/10 transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg">
                      <Settings className="h-5 w-5 mr-2 text-neutral-500" />
                      Einstellungen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-600 text-sm mb-4">
                      Verwalten Sie Ihr Profil, Benachrichtigungen und Konto-Einstellungen.
                    </p>
                    <Button 
                      variant="outline"
                      className="w-full bg-transparent hover:bg-neutral-50 border-neutral-300 transition-colors"
                    >
                      Einstellungen öffnen
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-200/60">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-red-600">0</div>
                    <p className="text-sm text-neutral-600">Aktive Inserate</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200/60">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <p className="text-sm text-neutral-600">Anfragen</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200/60">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <p className="text-sm text-neutral-600">Aufrufe</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-200/60">
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold text-amber-600">0</div>
                    <p className="text-sm text-neutral-600">Favoriten</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-neutral-200/60 shadow-lg shadow-neutral-900/5">
                <CardHeader>
                  <CardTitle className="text-lg">Erste Schritte</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center p-4 bg-neutral-50 rounded-lg border border-neutral-200/60">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-red-600 font-bold">1</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900">Erstellen Sie Ihr erstes Inserat</p>
                        <p className="text-sm text-neutral-600">Laden Sie Bilder hoch und beschreiben Sie Ihr Fahrzeug detailliert.</p>
                      </div>
                    </div>

                    <div className="flex items-center p-4 bg-neutral-50 rounded-lg border border-neutral-200/60">
                      <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center mr-3">
                        <span className="text-neutral-500 font-bold">2</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900">Vervollständigen Sie Ihr Profil</p>
                        <p className="text-sm text-neutral-600">Fügen Sie weitere Kontaktinformationen hinzu für bessere Ergebnisse.</p>
                      </div>
                    </div>

                    <div className="flex items-center p-4 bg-neutral-50 rounded-lg border border-neutral-200/60">
                      <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center mr-3">
                        <span className="text-neutral-500 font-bold">3</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-neutral-900">Teilen Sie Ihr Inserat</p>
                        <p className="text-sm text-neutral-600">Nutzen Sie soziale Medien um mehr potentielle Käufer zu erreichen.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </main>
      </div>
    </>
  );
}
