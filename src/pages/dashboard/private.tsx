import { useEffect, useState } from "react";
import DashboardLayout from "@/components/buyauto/dashboard/DashboardLayout";
import Head from "next/head";
import type { GetServerSideProps } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/integrations/supabase/types";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import UserDetailsSection from "@/components/buyauto/dashboard/UserDetailsSection";
import ListingsSection from "@/components/buyauto/dashboard/ListingsSection";
import OverviewSection from "@/components/buyauto/dashboard/OverviewSection";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userManagementService } from "@/services/userManagementService";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import DraftsSection from "@/components/buyauto/dashboard/DraftsSection";
import type { ListingDraft } from "@/services/listingDraftService";
import { MessageCenterRail } from "@/components/buyauto/messages/MessageCenterRail";
import { MessageCenterSheet } from "@/components/buyauto/messages/MessageCenterSheet";

export default function PrivateDashboardPage({ initialDrafts }: { initialDrafts: ListingDraft[] }) {
  const router = useRouter();
  const { user, loading: authLoading, refreshProfile, messageCount } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeForm, setUpgradeForm] = useState({
    garage_name: "",
    city: "",
    contact_email: ""
  });
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [inventoryTab, setInventoryTab] = useState<"active" | "sold" | "drafts">("active");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth");
      return;
    }

    if (user) {
      setIsLoading(false);
    }
  }, [user, authLoading, router]);

  const handleUpgradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpgrading(true);
    try {
      await userManagementService.upgradeToGarage(upgradeForm);
      toast.success("Erfolgreich zum Garage-Konto gewechselt!");
      await refreshProfile();
      router.push("/dashboard/garage");
    } catch (error: any) {
      toast.error("Fehler beim Upgrade: " + error.message);
    } finally {
      setIsUpgrading(false);
      setShowUpgradeModal(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout hideSidebar leftRail={<MessageCenterRail />}>
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
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <DashboardLayout hideSidebar leftRail={<MessageCenterRail />}>
        <div className="space-y-8" id="dashboard-content">
          {/* Upgrade Banner */}
          <div className="rounded-3xl border border-neutral-200/60 bg-white shadow-sm p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-neutral-50 flex items-center justify-center shadow-sm text-primary border border-neutral-200/60">
                <Building2 size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-neutral-900">Sind Sie ein Händler?</h3>
                <p className="text-neutral-600 text-sm">Wechseln Sie zum Garage-Profil, um mehrere Fahrzeuge und Ihr Inventar zu verwalten.</p>
              </div>
            </div>

            <div className="flex w-full sm:w-auto items-center justify-between sm:justify-end gap-3">
              <div className="sm:hidden">
                <MessageCenterSheet
                  count={Math.max(0, messageCount)}
                  triggerVariant="outline"
                  triggerClassName="rounded-2xl"
                />
              </div>
              <Button onClick={() => setShowUpgradeModal(true)} className="rounded-2xl">
                Zur Garage wechseln
              </Button>
            </div>
          </div>

          <a id="uebersicht" className="scroll-mt-20"></a>
          <OverviewSection />

          <a id="benutzerdaten" className="scroll-mt-20"></a>
          <UserDetailsSection />

          <a id="meine-inserate" className="scroll-mt-20"></a>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => setInventoryTab("active")}
              variant={inventoryTab === "active" ? "default" : "outline"}
              className="rounded-2xl"
            >
              Aktive Inserate
            </Button>
            <Button
              type="button"
              onClick={() => setInventoryTab("sold")}
              variant={inventoryTab === "sold" ? "default" : "outline"}
              className="rounded-2xl"
            >
              Verkauft
            </Button>
            <Button
              type="button"
              onClick={() => setInventoryTab("drafts")}
              variant={inventoryTab === "drafts" ? "default" : "outline"}
              className="rounded-2xl"
            >
              Entwürfe
            </Button>
          </div>

          {inventoryTab === "drafts" ? (
            <DraftsSection initialDrafts={initialDrafts} />
          ) : (
            <ListingsSection view={inventoryTab === "sold" ? "sold" : "active"} />
          )}
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

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = createPagesServerClient<Database>(ctx);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: "/auth",
        permanent: false,
      },
    };
  }

  const [{ data: profile }, { data: draftRows, error: draftsError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle(),
    supabase
      .from("listing_drafts")
      .select("*")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false }),
  ]);

  const role = (profile as unknown as { role?: string } | null)?.role ?? "private";

  if (role !== "private") {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  if (draftsError) {
    console.warn("Failed to fetch listing drafts (SSR):", draftsError);
  }

  type ListingDraftDbRow = Tables<"listing_drafts">;
  const safeDraftRows = (draftRows ?? []) as unknown as ListingDraftDbRow[];
  const initialDrafts: ListingDraft[] = safeDraftRows.map((row) => ({
    id: row.id,
    user_id: row.user_id,
    data: (row.data ?? {}) as any,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  return { props: { initialDrafts } };
};
