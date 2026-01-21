import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { ArrowDownRight, ArrowUpRight, Building2, Camera, Crown, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ListingsSection from "@/components/buyauto/dashboard/ListingsSection";
import { cn } from "@/lib/utils";
import { dashboardService, type DashboardStats } from "@/services/dashboardService";
import { uploadGarageLogo } from "@/services/storageService";
import { getMyGarage, updateMyGarage, type Garage } from "@/services/garageService";

export interface GarageDashboardProps {
  initialGarage: Garage | null;
}

type BannerState =
  | { kind: "idle" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unbekannter Fehler";
}

function getStableGarageLogoUrl(garageId: string, version?: number): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return "";
  const cleanBase = base.replace(/\/$/, "");
  const path = `garage-logos/${garageId}/logo_medium.webp`
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  const url = `${cleanBase}/storage/v1/object/public/listing-images/${path}`;
  return version ? `${url}?v=${version}` : url;
}

function getDealTypeLabel(input: { deal_type?: string; financing_type?: string | null }): string {
  if (input.deal_type === "direct_purchase") {
    if (input.financing_type === "leasing") return "Direktkauf · Leasing";
    return "Direktkauf · Barzahlung";
  }
  return "Leasingübernahme";
}

export function GarageDashboard({ initialGarage }: GarageDashboardProps) {
  const router = useRouter();

  const [garage, setGarage] = useState<Garage | null>(initialGarage);
  const [garageLoading, setGarageLoading] = useState(!initialGarage);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [profileDraft, setProfileDraft] = useState({
    garage_name: initialGarage?.garage_name ?? "",
    city: initialGarage?.city ?? "",
    contact_email: initialGarage?.contact_email ?? "",
  });

  const [profileSaving, setProfileSaving] = useState(false);
  const [banner, setBanner] = useState<BannerState>({ kind: "idle" });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoProgress, setLogoProgress] = useState<number>(0);
  const [logoVersion, setLogoVersion] = useState<number>(Date.now());

  const planLabel = useMemo(() => {
    const raw = (garage?.plan ?? "").trim();
    return raw || "free";
  }, [garage?.plan]);

  const logoUrl = useMemo(() => {
    if (!garage?.id) return undefined;
    const url = getStableGarageLogoUrl(garage.id, logoVersion);
    return url || undefined;
  }, [garage?.id, logoVersion]);

  useEffect(() => {
    let cancelled = false;

    async function loadGarage() {
      if (initialGarage) return;

      setGarageLoading(true);
      try {
        const g = await getMyGarage();
        if (cancelled) return;

        setGarage(g);
        setProfileDraft({
          garage_name: g?.garage_name ?? "",
          city: g?.city ?? "",
          contact_email: g?.contact_email ?? "",
        });
      } catch (e) {
        if (cancelled) return;
        setBanner({ kind: "error", message: `Garage-Profil konnte nicht geladen werden: ${getErrorMessage(e)}` });
      } finally {
        if (!cancelled) setGarageLoading(false);
      }
    }

    loadGarage();
    return () => {
      cancelled = true;
    };
  }, [initialGarage]);

  useEffect(() => {
    let cancelled = false;

    async function loadStats() {
      setStatsLoading(true);
      try {
        const s = await dashboardService.getDashboardStats();
        if (cancelled) return;
        setStats(s);
      } catch {
        if (cancelled) return;
        setStats(null);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    }

    loadStats();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!garage) return;
    setProfileDraft({
      garage_name: garage.garage_name ?? "",
      city: garage.city ?? "",
      contact_email: garage.contact_email ?? "",
    });
  }, [garage?.id]);

  const canSaveProfile = useMemo(() => {
    const nameOk = profileDraft.garage_name.trim().length >= 2;
    const emailOk = profileDraft.contact_email.trim().length === 0 || profileDraft.contact_email.includes("@");
    return nameOk && emailOk;
  }, [profileDraft.contact_email, profileDraft.garage_name]);

  async function handleSaveProfile() {
    setBanner({ kind: "idle" });
    setProfileSaving(true);

    try {
      const updated = await updateMyGarage({
        garage_name: profileDraft.garage_name.trim(),
        city: profileDraft.city.trim() ? profileDraft.city.trim() : null,
        contact_email: profileDraft.contact_email.trim() ? profileDraft.contact_email.trim() : null,
      });

      setGarage(updated);
      setBanner({ kind: "success", message: "Garage-Daten gespeichert." });
    } catch (e) {
      setBanner({ kind: "error", message: `Speichern fehlgeschlagen: ${getErrorMessage(e)}` });
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePickLogo(file: File) {
    if (!garage?.id) {
      setBanner({ kind: "error", message: "Kein Garage-Profil gefunden. Bitte Seite neu laden." });
      return;
    }

    setBanner({ kind: "idle" });
    setLogoUploading(true);
    setLogoProgress(0);

    try {
      await uploadGarageLogo(file, garage.id, setLogoProgress);
      setLogoVersion(Date.now());
      setBanner({ kind: "success", message: "Logo aktualisiert (sichtbar auf deinen Inseraten)." });
    } catch (e) {
      setBanner({ kind: "error", message: `Upload fehlgeschlagen: ${getErrorMessage(e)}` });
    } finally {
      setLogoUploading(false);
      setLogoProgress(0);
    }
  }

  const statCards = [
    { label: "Aktiv", value: stats?.active ?? 0 },
    { label: "In Prüfung", value: stats?.pending ?? 0 },
    { label: "Verkauft", value: stats?.sold ?? 0 },
    { label: "Abgelaufen", value: stats?.expired ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl overflow-hidden border-neutral-200/60 shadow-sm">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80" />
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border border-white/25 bg-white/10">
                  <AvatarImage src={logoUrl} alt={garage?.garage_name ?? "Garage"} />
                  <AvatarFallback className="bg-white/10 text-white">
                    <Building2 className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
                      {garage?.garage_name ?? "Garage Dashboard"}
                    </h1>
                    <Badge className="bg-white/15 text-white border-white/25 rounded-full">
                      <Crown className="h-3.5 w-3.5 mr-1" />
                      {planLabel}
                    </Badge>
                  </div>
                  <p className="text-white/80 text-sm mt-1">Inventar verwalten, Plan anpassen und Profil pflegen.</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => router.push("/inserat-erstellen")}
                  className="bg-white text-neutral-900 hover:bg-white/90 rounded-2xl"
                >
                  Neues Inserat
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => router.push("/dashboard")}
                  className="bg-white/15 text-white hover:bg-white/20 border border-white/20 rounded-2xl"
                >
                  Zur Übersicht
                </Button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {statCards.map((s) => (
                <div key={s.label} className="rounded-2xl bg-white/10 border border-white/15 p-4">
                  <div className="text-xs text-white/75">{s.label}</div>
                  <div className="mt-1 text-2xl font-bold text-white">
                    {statsLoading ? <span className="inline-block h-7 w-10 rounded bg-white/15 animate-pulse" /> : s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="p-4 sm:p-6">
            {banner.kind !== "idle" && (
              <div
                className={cn(
                  "mb-4 rounded-2xl border px-4 py-3 text-sm",
                  banner.kind === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-red-200 bg-red-50 text-red-900"
                )}
              >
                {banner.message}
              </div>
            )}

            <Tabs defaultValue="inventory" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto rounded-2xl bg-neutral-100 p-1">
                <TabsTrigger value="inventory" className="rounded-xl">
                  Inventar
                </TabsTrigger>
                <TabsTrigger value="profile" className="rounded-xl">
                  Profil & Logo
                </TabsTrigger>
                <TabsTrigger value="plan" className="rounded-xl">
                  Plan
                </TabsTrigger>
              </TabsList>

              <TabsContent value="inventory" className="mt-5">
                <div className="rounded-3xl border border-neutral-200/60 bg-white shadow-sm p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold tracking-tight text-neutral-900">Inserate</h2>
                      <p className="text-sm text-neutral-600 mt-1">Verwalte Status, Laufzeit und Premium-Optionen.</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <ListingsSection />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="profile" className="mt-5">
                <div className="grid gap-4 lg:grid-cols-5">
                  <div className="lg:col-span-2 rounded-3xl border border-neutral-200/60 bg-white shadow-sm p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold tracking-tight text-neutral-900">Logo</h2>
                        <p className="text-sm text-neutral-600 mt-1">Wird auf deinen Inseraten angezeigt.</p>
                      </div>
                      <Button
                        variant="outline"
                        className="rounded-2xl"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={garageLoading || logoUploading}
                      >
                        {logoUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Upload…
                          </>
                        ) : (
                          <>
                            <Camera className="h-4 w-4 mr-2" />
                            Logo wählen
                          </>
                        )}
                      </Button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void handlePickLogo(file);
                        e.currentTarget.value = "";
                      }}
                    />

                    <div className="mt-5 flex items-center gap-4">
                      <Avatar className="h-20 w-20 rounded-3xl border border-neutral-200/60">
                        <AvatarImage src={logoUrl} alt={garage?.garage_name ?? "Logo"} />
                        <AvatarFallback className="bg-neutral-100 text-neutral-700">
                          <Building2 className="h-6 w-6" />
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-neutral-900 truncate">{garage?.garage_name ?? "—"}</div>
                        <div className="text-sm text-neutral-600 truncate">{garage?.city ?? "Standort nicht gesetzt"}</div>

                        {logoUploading && (
                          <div className="mt-2">
                            <div className="h-2 w-48 rounded-full bg-neutral-100 overflow-hidden">
                              <div
                                className="h-full bg-primary transition-[width]"
                                style={{ width: `${Math.max(5, Math.min(100, logoProgress))}%` }}
                              />
                            </div>
                            <div className="mt-1 text-xs text-neutral-500">{logoProgress}%</div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
                      <div className="text-sm font-semibold text-neutral-900">Tipp</div>
                      <div className="text-sm text-neutral-600 mt-1">Quadratisch (z.B. 800×800) wirkt am saubersten.</div>
                    </div>
                  </div>

                  <div className="lg:col-span-3 rounded-3xl border border-neutral-200/60 bg-white shadow-sm p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold tracking-tight text-neutral-900">Garage Details</h2>
                        <p className="text-sm text-neutral-600 mt-1">Diese Angaben sind für dein Dashboard relevant.</p>
                      </div>
                      <Button
                        onClick={() => void handleSaveProfile()}
                        className="rounded-2xl"
                        disabled={garageLoading || profileSaving || !canSaveProfile}
                      >
                        {profileSaving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Speichern…
                          </>
                        ) : (
                          "Speichern"
                        )}
                      </Button>
                    </div>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label htmlFor="garage_name">Garagenname</Label>
                        <Input
                          id="garage_name"
                          value={profileDraft.garage_name}
                          onChange={(e) => setProfileDraft((p) => ({ ...p, garage_name: e.target.value }))}
                          placeholder="z.B. Garage Muster AG"
                          className="rounded-2xl"
                          disabled={garageLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">Stadt</Label>
                        <Input
                          id="city"
                          value={profileDraft.city}
                          onChange={(e) => setProfileDraft((p) => ({ ...p, city: e.target.value }))}
                          placeholder="z.B. Zürich"
                          className="rounded-2xl"
                          disabled={garageLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contact_email">Kontakt E-Mail</Label>
                        <Input
                          id="contact_email"
                          value={profileDraft.contact_email}
                          onChange={(e) => setProfileDraft((p) => ({ ...p, contact_email: e.target.value }))}
                          placeholder="z.B. sales@garage.ch"
                          className="rounded-2xl"
                          disabled={garageLoading}
                        />
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
                      <div className="text-sm font-semibold text-neutral-900">Hinweis</div>
                      <div className="text-sm text-neutral-600 mt-1">
                        Zusätzliche öffentliche Profilfelder können wir als nächstes ergänzen.
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="plan" className="mt-5">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-1 rounded-3xl border border-neutral-200/60 bg-white shadow-sm p-5">
                    <h2 className="text-lg font-bold tracking-tight text-neutral-900">Aktueller Plan</h2>
                    <p className="text-sm text-neutral-600 mt-1">Platzhalter (Stripe-Anbindung als nächster Schritt).</p>

                    <div className="mt-4 rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-neutral-900">{planLabel}</div>
                        <Badge variant="secondary" className="rounded-full">
                          {garage?.listing_limit ?? 10} Slots
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm text-neutral-600">Up-/Downgrades jederzeit möglich.</div>
                    </div>

                    <div className="mt-4 grid gap-2">
                      <Button
                        className="rounded-2xl"
                        onClick={() =>
                          setBanner({
                            kind: "error",
                            message:
                              "Plan-Wechsel ist aktuell Placeholder. Wenn du willst, binde ich das direkt an eure bestehenden Billing/Stripe-Flows an.",
                          })
                        }
                      >
                        Plan ändern
                      </Button>
                    </div>
                  </div>

                  <div className="lg:col-span-2 rounded-3xl border border-neutral-200/60 bg-white shadow-sm p-5">
                    <h3 className="text-lg font-bold tracking-tight text-neutral-900">Plan Optionen</h3>
                    <p className="text-sm text-neutral-600 mt-1">Minimaler Vergleich (Platzhalter).</p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-3xl border border-neutral-200/60 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-neutral-900">Starter</div>
                          <Badge variant="secondary" className="rounded-full">
                            10 Slots
                          </Badge>
                        </div>
                        <div className="mt-2 text-sm text-neutral-600">Für kleine Inventare.</div>
                        <Button
                          variant="outline"
                          className="mt-4 w-full rounded-2xl"
                          onClick={() => setBanner({ kind: "error", message: "Downgrade ist noch nicht angebunden (Placeholder)." })}
                        >
                          <ArrowDownRight className="h-4 w-4 mr-2" />
                          Downgrade
                        </Button>
                      </div>

                      <div className="rounded-3xl border border-neutral-200/60 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-neutral-900">Pro</div>
                          <Badge className="rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
                            25 Slots
                          </Badge>
                        </div>
                        <div className="mt-2 text-sm text-neutral-600">Mehr Slots + Priorität (später).</div>
                        <Button
                          className="mt-4 w-full rounded-2xl"
                          onClick={() => setBanner({ kind: "error", message: "Upgrade ist noch nicht angebunden (Placeholder)." })}
                        >
                          <ArrowUpRight className="h-4 w-4 mr-2" />
                          Upgrade
                        </Button>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
                      <div className="text-sm font-semibold text-neutral-900">Nächster Schritt</div>
                      <div className="text-sm text-neutral-600 mt-1">
                        Sag mir kurz, ob eure Pläne/Preise aus Stripe kommen (Products/Prices) oder fix sind – dann binde ich Up-/Downgrade sauber ein.
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {garageLoading && (
        <div className="rounded-3xl border border-neutral-200/60 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-sm text-neutral-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Garage-Profil wird geladen…
          </div>
        </div>
      )}
    </div>
  );
}