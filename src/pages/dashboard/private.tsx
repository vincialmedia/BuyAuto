
import { useEffect, useState } from "react";
import DashboardLayout from "@/components/buyauto/dashboard/DashboardLayout";
import Head from "next/head";
import { useAuth } from "@/contexts/AuthContext";
import UserDetailsSection from "@/components/buyauto/dashboard/UserDetailsSection";
import ListingsSection from "@/components/buyauto/dashboard/ListingsSection";
import OverviewSection from "@/components/buyauto/dashboard/OverviewSection";
import { useRouter } from "next/router";
import { dashboardService } from "@/services/dashboardService";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userManagementService } from "@/services/userManagementService";
import { toast } from "sonner";
import { Car, Building2 } from "lucide-react";

export default function PrivateDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeForm, setUpgradeForm] = useState({
    garage_name: "",
    city: "",
    contact_email: ""
  });
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
      return;
    }

    if (user) {
      // Just simulate loading for smoothness since we don't fetch stats here anymore strictly
      // or we can keep it if dashboardService relies on it.
      // The original code fetched stats.
      setIsLoading(false);
    }
  }, [user, authLoading, router]);

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpgrading(true);
    try {
      await userManagementService.upgradeToGarage(upgradeForm);
      toast.success("Erfolgreich zum Garage-Konto gewechselt!");
      await refreshProfile(); // Refresh auth context to get new role
      router.push("/dashboard/garage"); // Redirect will be handled by router or explicit push
    } catch (error: any) {
      toast.error("Fehler beim Upgrade: " + error.message);
    } finally {
      setIsUpgrading(false);
      setShowUpgradeModal(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Lade Dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) return null;

  return (
    <>
      <Head>
        <title>Dashboard - Buy-Auto.ch</title>
      </Head>
      <DashboardLayout>
        <div className="space-y-8" id="dashboard-content">
            
            {/* Upgrade Banner */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center shadow-sm text-primary">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">Sind Sie ein Händler?</h3>
                  <p className="text-gray-600 text-sm">Wechseln Sie zum Garage-Profil, um mehrere Fahrzeuge und Ihr Inventar zu verwalten.</p>
                </div>
              </div>
              <Button onClick={() => setShowUpgradeModal(true)}>
                Zur Garage wechseln
              </Button>
            </div>

            <a id="uebersicht" className="scroll-mt-20"></a>
            <OverviewSection />
            
            <a id="benutzerdaten" className="scroll-mt-20"></a>
            <UserDetailsSection />
            
            <a id="meine-inserate" className="scroll-mt-20"></a>
            <ListingsSection />
        </div>

        {/* Upgrade Modal */}
        <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Garage Profil erstellen</DialogTitle>
              <DialogDescription>
                Erweitern Sie Ihr Konto, um als Händler aufzutreten. Dies ermöglicht Ihnen erweiterte Funktionen.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpgradeSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="garage_name">Name der Garage / Firma</Label>
                <Input 
                  id="garage_name" 
                  required 
                  value={upgradeForm.garage_name}
                  onChange={(e) => setUpgradeForm({...upgradeForm, garage_name: e.target.value})}
                  placeholder="Auto Muster AG"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ort</Label>
                <Input 
                  id="city" 
                  required 
                  value={upgradeForm.city}
                  onChange={(e) => setUpgradeForm({...upgradeForm, city: e.target.value})}
                  placeholder="Zürich"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Kontakt E-Mail</Label>
                <Input 
                  id="contact_email" 
                  type="email"
                  required 
                  value={upgradeForm.contact_email}
                  onChange={(e) => setUpgradeForm({...upgradeForm, contact_email: e.target.value})}
                  placeholder="info@muster-garage.ch"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowUpgradeModal(false)}>Abbrechen</Button>
                <Button type="submit" disabled={isUpgrading}>
                  {isUpgrading ? "Wird erstellt..." : "Kostenlos upgraden"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    </>
  );
}
