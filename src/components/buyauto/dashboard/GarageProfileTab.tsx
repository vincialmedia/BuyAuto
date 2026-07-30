import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { Camera, Loader2, Building2, ExternalLink, Lock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { uploadGarageLogo, uploadGarageHeaderImage, uploadGarageTeamMemberPhoto } from "@/services/storageService";
import { generateSlugFromName, type Garage, type TeamMember } from "@/services/garageService";
import { LocationAutocomplete } from "@/components/buyauto/create-listing/step1/LocationAutocomplete";
import { useDealerPlan } from "@/hooks/use-dealer-plan";
import { GARAGE_PLANS } from "@/lib/buyauto/garagePlans";

interface GarageProfileTabProps {
  garage: Garage | null;
  onUpdate: (updates: Partial<Garage>) => Promise<void>;
  logoUrl?: string;
  logoVersion: number;
  onLogoVersionChange: (version: number) => void;
}

type BannerState =
  | { kind: "idle" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const DAYS_OF_WEEK = [
  { key: "monday", label: "Montag" },
  { key: "tuesday", label: "Dienstag" },
  { key: "wednesday", label: "Mittwoch" },
  { key: "thursday", label: "Donnerstag" },
  { key: "friday", label: "Freitag" },
  { key: "saturday", label: "Samstag" },
  { key: "sunday", label: "Sonntag" },
];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unbekannter Fehler";
}

function getSiteOrigin(): string {
  if (typeof window === "undefined") return "https://buyauto.ch";
  return window.location.origin || "https://buyauto.ch";
}

function normalizeWebsiteUrl(input: string): string {
  const v = input.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

function isValidWebsiteUrl(input: string): boolean {
  const v = input.trim();
  if (!v) return true;
  try {
    new URL(normalizeWebsiteUrl(v));
    return true;
  } catch {
    return false;
  }
}

function createId(prefix = "id"): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return `${prefix}_${crypto.randomUUID()}`;
    }
  } catch {
    // ignore
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeTeamMembers(value: unknown): TeamMember[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((m) => m && typeof m === "object")
    .map((m) => m as TeamMember)
    .filter((m) => typeof m.id === "string" && typeof m.name === "string")
    .map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role ?? null,
      bio: m.bio ?? null,
      image_url: m.image_url ?? null,
      order: typeof m.order === "number" ? m.order : null,
    }))
    .filter((m) => m.id.trim().length > 0 && m.name.trim().length > 0)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // ignore and fallback
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function GarageProfileTab({
  garage,
  onUpdate,
  logoUrl,
  logoVersion,
  onLogoVersionChange,
}: GarageProfileTabProps) {
  const [profileDraft, setProfileDraft] = useState({
    contact_email: garage?.contact_email ?? "",
    phone_number: garage?.phone_number ?? "",
    website_url: garage?.website_url ?? "",
    description: garage?.description ?? "",
    services: garage?.services ?? [],
    opening_hours: garage?.opening_hours ?? {},
  });

  const [teamDraft, setTeamDraft] = useState<TeamMember[]>(() => normalizeTeamMembers(garage?.team_members));

  const [profileSaving, setProfileSaving] = useState(false);
  const [banner, setBanner] = useState<BannerState>({ kind: "idle" });

  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const headerInputRef = useRef<HTMLInputElement | null>(null);

  const [logoUploading, setLogoUploading] = useState(false);
  const [logoProgress, setLogoProgress] = useState<number>(0);

  const [headerUploading, setHeaderUploading] = useState(false);
  const [headerProgress, setHeaderProgress] = useState<number>(0);
  const [headerImageUrl, setHeaderImageUrl] = useState(garage?.header_image_url ?? "");

  const [newService, setNewService] = useState("");

  const [shareOrigin, setShareOrigin] = useState("https://buyauto.ch");
  const [copyingPublicUrl, setCopyingPublicUrl] = useState(false);
  const [copyingEmbed, setCopyingEmbed] = useState(false);

  const [teamUploadingId, setTeamUploadingId] = useState<string | null>(null);
  const [teamUploadProgress, setTeamUploadProgress] = useState<number>(0);

  useEffect(() => {
    if (!garage) return;
    setProfileDraft({
      contact_email: garage.contact_email ?? "",
      phone_number: garage.phone_number ?? "",
      website_url: garage.website_url ?? "",
      description: garage.description ?? "",
      services: garage.services ?? [],
      opening_hours: garage.opening_hours ?? {},
    });
    setHeaderImageUrl(garage.header_image_url ?? "");
    setTeamDraft(normalizeTeamMembers(garage.team_members));
  }, [garage?.id]);

  useEffect(() => {
    setShareOrigin(getSiteOrigin());
  }, []);

  const canSaveProfile =
    (profileDraft.contact_email.trim().length === 0 || profileDraft.contact_email.includes("@")) &&
    isValidWebsiteUrl(profileDraft.website_url);

  // Website-Tools (inventory widget for the garage's own site) are a Growth+
  // fence. While the plan is still resolving we hide the snippet rather than
  // flash it and take it away again.
  const { plan: dealerPlan, resolved: planResolved } = useDealerPlan(garage);
  const hasWebsiteTools = planResolved && Boolean(dealerPlan?.websiteTools);

  const dealerSlug = garage?.slug?.trim() ?? "";
  const publicProfileUrl = dealerSlug ? `${shareOrigin}/${dealerSlug}` : "";
  const embedUrl = dealerSlug ? `${shareOrigin}/embed/garage/${dealerSlug}` : "";

  const embedSnippet = useMemo(() => {
    if (!dealerSlug) return "";
    const iframeId = `buyauto-dealer-${dealerSlug.replace(/[^a-z0-9_-]/gi, "") || "widget"}`;

    const src = `${embedUrl}?embedId=${encodeURIComponent(iframeId)}`;

    return `<iframe id="${iframeId}" src="${src}" style="width:100%;border:0;display:block;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
<script>
(function(){
  var iframe=document.getElementById("${iframeId}");
  if(!iframe) return;

  function setHeight(h){
    if(typeof h!=="number") return;
    iframe.style.height = Math.max(480, Math.ceil(h)) + "px";
  }

  function onMessage(e){
    if(!e || !e.data) return;
    if(e.source !== iframe.contentWindow) return;

    if(e.data.type==="buyauto:resize"){
      if(e.data.id!=="${iframeId}") return;
      return setHeight(e.data.height);
    }

    if(e.data.type==="BUY_AUTO_IFRAME_HEIGHT"){
      return setHeight(e.data.height);
    }
  }

  window.addEventListener("message", onMessage, false);
})();
</script>`;
  }, [dealerSlug, embedUrl]);

  async function handleCopyPublicUrl() {
    if (!publicProfileUrl) return;
    setCopyingPublicUrl(true);
    const ok = await copyToClipboard(publicProfileUrl);
    setCopyingPublicUrl(false);
    setBanner(ok ? { kind: "success", message: "Profil-Link kopiert." } : { kind: "error", message: "Kopieren fehlgeschlagen." });
  }

  async function handleCopyEmbed() {
    if (!embedSnippet) return;
    setCopyingEmbed(true);
    const ok = await copyToClipboard(embedSnippet);
    setCopyingEmbed(false);
    setBanner(ok ? { kind: "success", message: "Embed-Code kopiert." } : { kind: "error", message: "Kopieren fehlgeschlagen." });
  }

  function addTeamMember() {
    setTeamDraft((prev) => {
      const nextOrder = prev.length > 0 ? Math.max(...prev.map((m) => m.order ?? 0)) + 1 : 1;
      return [
        ...prev,
        {
          id: createId("team"),
          name: "",
          role: null,
          bio: null,
          image_url: null,
          order: nextOrder,
        },
      ];
    });
  }

  function updateTeamMember(id: string, patch: Partial<TeamMember>) {
    setTeamDraft((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        return { ...m, ...patch };
      })
    );
  }

  function removeTeamMember(id: string) {
    setTeamDraft((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleSaveProfile() {
    setBanner({ kind: "idle" });
    setProfileSaving(true);

    const normalizedWebsite = profileDraft.website_url.trim()
      ? normalizeWebsiteUrl(profileDraft.website_url)
      : "";

    const baseUpdates: Partial<Garage> = {
      contact_email: profileDraft.contact_email.trim() || null,
      phone_number: profileDraft.phone_number.trim() || null,
      website_url: normalizedWebsite || null,
      description: profileDraft.description.trim() || null,
      services: profileDraft.services.length > 0 ? profileDraft.services : null,
      opening_hours: Object.keys(profileDraft.opening_hours).length > 0 ? profileDraft.opening_hours : null,
      header_image_url: headerImageUrl || null,
    };

    const sanitizedTeam = teamDraft
      .map((m, idx) => ({
        id: m.id,
        name: (m.name ?? "").toString().trim(),
        role: (m.role ?? "").toString().trim() || null,
        bio: (m.bio ?? "").toString().trim() || null,
        image_url: (m.image_url ?? "").toString().trim() || null,
        order: typeof m.order === "number" ? m.order : idx + 1,
      }))
      .filter((m) => m.id.trim().length > 0 && m.name.trim().length > 0);

    try {
      await onUpdate({
        ...baseUpdates,
        team_members: sanitizedTeam.length > 0 ? sanitizedTeam : [],
      });

      setBanner({ kind: "success", message: "Profil-Daten gespeichert." });
    } catch (e) {
      const msg = getErrorMessage(e);
      const looksLikeMissingTeamColumn =
        msg.toLowerCase().includes("team_members") &&
        (msg.toLowerCase().includes("column") || msg.toLowerCase().includes("schema") || msg.toLowerCase().includes("not found"));

      if (looksLikeMissingTeamColumn) {
        try {
          await onUpdate(baseUpdates);
          setBanner({
            kind: "success",
            message: "Profil-Daten gespeichert. Team wird aktiv, sobald das Update im Backend ausgerollt ist.",
          });
        } catch (e2) {
          setBanner({ kind: "error", message: `Speichern fehlgeschlagen: ${getErrorMessage(e2)}` });
        }
      } else {
        setBanner({ kind: "error", message: `Speichern fehlgeschlagen: ${msg}` });
      }
    } finally {
      setProfileSaving(false);
    }
  }

  async function handlePickLogo(file: File) {
    if (!garage?.id) {
      setBanner({ kind: "error", message: "Kein Garage-Profil gefunden." });
      return;
    }

    setBanner({ kind: "idle" });
    setLogoUploading(true);
    setLogoProgress(0);

    try {
      const url = await uploadGarageLogo(file, garage.id, setLogoProgress);
      await onUpdate({ logo_url: url });
      onLogoVersionChange(Date.now());
      setBanner({ kind: "success", message: "Logo aktualisiert." });
    } catch (e) {
      setBanner({ kind: "error", message: `Logo-Upload fehlgeschlagen: ${getErrorMessage(e)}` });
    } finally {
      setLogoUploading(false);
      setLogoProgress(0);
    }
  }

  async function handlePickHeader(file: File) {
    if (!garage?.id) {
      setBanner({ kind: "error", message: "Kein Garage-Profil gefunden." });
      return;
    }

    setBanner({ kind: "idle" });
    setHeaderUploading(true);
    setHeaderProgress(0);

    try {
      const url = await uploadGarageHeaderImage(file, garage.id, setHeaderProgress);
      setHeaderImageUrl(url);
      setBanner({ kind: "success", message: "Header-Bild hochgeladen." });
    } catch (e) {
      setBanner({ kind: "error", message: `Header-Upload fehlgeschlagen: ${getErrorMessage(e)}` });
    } finally {
      setHeaderUploading(false);
      setHeaderProgress(0);
    }
  }

  async function handleTeamPhotoPick(memberId: string, file: File) {
    if (!garage?.id) return;

    setBanner({ kind: "idle" });
    setTeamUploadingId(memberId);
    setTeamUploadProgress(0);

    try {
      const url = await uploadGarageTeamMemberPhoto(file, garage.id, memberId, setTeamUploadProgress);
      updateTeamMember(memberId, { image_url: url });
      setBanner({ kind: "success", message: "Teamfoto hochgeladen (nicht vergessen: Profil speichern)." });
    } catch (e) {
      setBanner({ kind: "error", message: `Teamfoto-Upload fehlgeschlagen: ${getErrorMessage(e)}` });
    } finally {
      setTeamUploadingId(null);
      setTeamUploadProgress(0);
    }
  }

  function addService() {
    const trimmed = newService.trim();
    if (!trimmed || profileDraft.services.includes(trimmed)) return;
    setProfileDraft((p) => ({ ...p, services: [...p.services, trimmed] }));
    setNewService("");
  }

  function removeService(service: string) {
    setProfileDraft((p) => ({ ...p, services: p.services.filter((s) => s !== service) }));
  }

  function updateOpeningHours(day: string, field: "from" | "to" | "closed", value: string | boolean) {
    setProfileDraft((p) => {
      const current = p.opening_hours[day] || { from: "", to: "", closed: false };
      return {
        ...p,
        opening_hours: {
          ...p.opening_hours,
          [day]: { ...current, [field]: value },
        },
      };
    });
  }

  return (
    <div className="space-y-4">
      {banner.kind !== "idle" && (
        <div
          className={cn(
            "rounded-2xl border px-4 py-3 text-sm",
            banner.kind === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
          )}
        >
          {banner.message}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Logo Section */}
        <div className="rounded-3xl border border-neutral-200/60 bg-white shadow-sm p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-neutral-900">Logo</h3>
              <p className="text-sm text-neutral-600 mt-1">Wird auf Inseraten angezeigt</p>
            </div>
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => logoInputRef.current?.click()}
              disabled={logoUploading}
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
            ref={logoInputRef}
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

            {logoUploading && (
              <div className="flex-1">
                <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-[width]"
                    style={{ width: `${Math.max(5, Math.min(100, logoProgress))}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-neutral-500">{logoProgress}%</div>
              </div>
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
            <div className="text-sm font-semibold text-neutral-900">Tipp</div>
            <div className="text-sm text-neutral-600 mt-1">Quadratisch (800×800px) wirkt am besten.</div>
          </div>
        </div>

        {/* Header Image Section */}
        <div className="rounded-3xl border border-neutral-200/60 bg-white shadow-sm p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-neutral-900">Header-Bild</h3>
              <p className="text-sm text-neutral-600 mt-1">Wird auf Profil-Seite angezeigt</p>
            </div>
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => headerInputRef.current?.click()}
              disabled={headerUploading}
            >
              {headerUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Upload…
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4 mr-2" />
                  Bild wählen
                </>
              )}
            </Button>
          </div>

          <input
            ref={headerInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handlePickHeader(file);
              e.currentTarget.value = "";
            }}
          />

          <div className="mt-5">
            <div className="aspect-[3/1] rounded-2xl border border-neutral-200/60 bg-neutral-100 overflow-hidden">
              {headerImageUrl ? (
                <img src={headerImageUrl} alt="Header" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                  <Camera className="h-8 w-8" />
                </div>
              )}
            </div>

            {headerUploading && (
              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-[width]"
                    style={{ width: `${Math.max(5, Math.min(100, headerProgress))}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-neutral-500">{headerProgress}%</div>
              </div>
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4">
            <div className="text-sm font-semibold text-neutral-900">Tipp</div>
            <div className="text-sm text-neutral-600 mt-1">Querformat (1200×400px) sieht professionell aus.</div>
          </div>
        </div>
      </div>

      {/* Contact & Bio Section */}
      <div className="rounded-3xl border border-neutral-200/60 bg-white shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-neutral-900">Kontakt & Beschreibung</h3>
            <p className="text-sm text-neutral-600 mt-1">Wie können Kunden Sie erreichen?</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact_email">E-Mail</Label>
            <Input
              id="contact_email"
              type="email"
              value={profileDraft.contact_email}
              onChange={(e) => setProfileDraft((p) => ({ ...p, contact_email: e.target.value }))}
              placeholder="z.B. info@garage.ch"
              className="rounded-2xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone_number">Telefon</Label>
            <Input
              id="phone_number"
              value={profileDraft.phone_number}
              onChange={(e) => setProfileDraft((p) => ({ ...p, phone_number: e.target.value }))}
              placeholder="z.B. +41 44 123 45 67"
              className="rounded-2xl"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="website_url">Webseite</Label>
            <Input
              id="website_url"
              value={profileDraft.website_url}
              onChange={(e) => setProfileDraft((p) => ({ ...p, website_url: e.target.value }))}
              placeholder="z.B. https://www.ihre-garage.ch"
              className="rounded-2xl"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Beschreibung / Bio</Label>
            <Textarea
              id="description"
              value={profileDraft.description}
              onChange={(e) => setProfileDraft((p) => ({ ...p, description: e.target.value }))}
              placeholder="Beschreiben Sie Ihre Garage und Ihre Dienstleistungen..."
              className="rounded-2xl min-h-[120px]"
            />
            <p className="text-xs text-neutral-500">Wird auf Ihrer öffentlichen Profil-Seite angezeigt</p>
          </div>
        </div>
      </div>

      {/* Services Section */}
      <div className="rounded-3xl border border-neutral-200/60 bg-white shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-neutral-900">Dienstleistungen</h3>
            <p className="text-sm text-neutral-600 mt-1">Was bieten Sie an?</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addService();
                }
              }}
              placeholder="z.B. Werkstatt, Reifenwechsel, Autoverkauf..."
              className="rounded-2xl"
            />
            <Button onClick={addService} className="rounded-2xl">
              Hinzufügen
            </Button>
          </div>

          {profileDraft.services.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profileDraft.services.map((service) => (
                <Badge
                  key={service}
                  variant="secondary"
                  className="rounded-full px-3 py-1 cursor-pointer hover:bg-neutral-200"
                  onClick={() => removeService(service)}
                >
                  {service} ×
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Opening Hours Section */}
      <div className="rounded-3xl border border-neutral-200/60 bg-white shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-neutral-900">Öffnungszeiten</h3>
            <p className="text-sm text-neutral-600 mt-1">Wann sind Sie für Kunden erreichbar?</p>
          </div>
        </div>

        <div className="space-y-3">
          {DAYS_OF_WEEK.map((day) => {
            const hours = profileDraft.opening_hours[day.key] || { from: "", to: "", closed: false };
            return (
              <div key={day.key} className="grid grid-cols-2 gap-3 items-center sm:grid-cols-[120px_1fr_1fr_auto]">
                <Label className="col-span-2 text-sm font-medium sm:col-span-1">{day.label}</Label>
                <Input
                  type="time"
                  value={hours.from}
                  onChange={(e) => updateOpeningHours(day.key, "from", e.target.value)}
                  disabled={hours.closed}
                  className="rounded-2xl"
                />
                <Input
                  type="time"
                  value={hours.to}
                  onChange={(e) => updateOpeningHours(day.key, "to", e.target.value)}
                  disabled={hours.closed}
                  className="rounded-2xl"
                />
                <Button
                  variant={hours.closed ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => updateOpeningHours(day.key, "closed", !hours.closed)}
                  className="col-span-2 rounded-2xl whitespace-nowrap sm:col-span-1"
                >
                  {hours.closed ? "Öffnen" : "Geschlossen"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Team Section */}
      <div className="rounded-3xl border border-neutral-200/60 bg-white shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-neutral-900">Team</h3>
            <p className="text-sm text-neutral-600 mt-1">Zeigen Sie Ihr Team auf der öffentlichen Profil-Seite.</p>
          </div>
          <Button onClick={addTeamMember} className="rounded-2xl">
            Teammitglied hinzufügen
          </Button>
        </div>

        {teamDraft.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4 text-sm text-neutral-700">
            Noch keine Teammitglieder hinterlegt.
          </div>
        ) : (
          <div className="space-y-3">
            {teamDraft.map((m, idx) => (
              <div key={m.id} className="rounded-3xl border border-neutral-200/60 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="grid flex-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`team_${m.id}_name`}>Name</Label>
                      <Input
                        id={`team_${m.id}_name`}
                        value={m.name ?? ""}
                        onChange={(e) => updateTeamMember(m.id, { name: e.target.value })}
                        placeholder="z.B. Max Muster"
                        className="rounded-2xl"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`team_${m.id}_role`}>Rolle</Label>
                      <Input
                        id={`team_${m.id}_role`}
                        value={m.role ?? ""}
                        onChange={(e) => updateTeamMember(m.id, { role: e.target.value })}
                        placeholder="z.B. Verkauf / Werkstatt"
                        className="rounded-2xl"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor={`team_${m.id}_bio`}>Kurzbeschreibung</Label>
                      <Textarea
                        id={`team_${m.id}_bio`}
                        value={m.bio ?? ""}
                        onChange={(e) => updateTeamMember(m.id, { bio: e.target.value })}
                        placeholder="Optional – 1–2 Sätze"
                        className="rounded-2xl min-h-[90px]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      <div className="h-12 w-12 overflow-hidden rounded-2xl bg-neutral-100 border border-neutral-200/60">
                        {m.image_url ? (
                          <img src={m.image_url} alt={m.name ?? "Team"} className="h-full w-full object-cover" />
                        ) : null}
                      </div>

                      <label className="inline-flex cursor-pointer">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handleTeamPhotoPick(m.id, file);
                            e.currentTarget.value = "";
                          }}
                        />
                        <span className="inline-flex items-center rounded-2xl border border-neutral-200/60 bg-white px-3 py-2 text-xs font-semibold text-neutral-900 hover:bg-neutral-50">
                          Foto wählen
                        </span>
                      </label>

                      {teamUploadingId === m.id ? (
                        <div className="w-full sm:w-[140px]">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                            <div className="h-full bg-primary transition-[width]" style={{ width: `${Math.max(5, Math.min(100, teamUploadProgress))}%` }} />
                          </div>
                          <div className="mt-1 text-[11px] text-neutral-500">{teamUploadProgress}%</div>
                        </div>
                      ) : null}
                    </div>

                    <Button variant="outline" className="rounded-2xl" onClick={() => removeTeamMember(m.id)}>
                      Entfernen
                    </Button>
                    <div className="text-xs text-neutral-500 sm:text-right">
                      Position: {typeof m.order === "number" ? m.order : idx + 1}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-neutral-500">
          Tipp: Teammitglieder erscheinen öffentlich erst, nachdem Sie “Profil-Daten speichern” gedrückt haben.
        </p>
      </div>

      {/* Share Panel */}
      <div className="rounded-3xl border border-neutral-200/60 bg-white shadow-sm p-5">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-neutral-900">Öffentliches Profil & Embed</h3>
            <p className="text-sm text-neutral-600 mt-1">Teilen Sie Ihren Profil-Link oder binden Sie Ihr Inserate-Widget ein</p>
          </div>
        </div>

        {dealerSlug ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-neutral-900">Profil-Link</div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => void handleCopyPublicUrl()}
                    disabled={copyingPublicUrl}
                  >
                    {copyingPublicUrl ? "Kopiere…" : "Kopieren"}
                  </Button>
                  <Button asChild className="rounded-2xl">
                    <a href={publicProfileUrl} target="_blank" rel="noreferrer">
                      Öffnen <ExternalLink className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </div>
              </div>
              <div className="text-sm text-neutral-700 break-all">{publicProfileUrl}</div>
            </div>

            {hasWebsiteTools ? (
              <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-neutral-900">White-Label Embed (auto Höhe)</div>
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => void handleCopyEmbed()}
                    disabled={copyingEmbed}
                  >
                    {copyingEmbed ? "Kopiere…" : "Code kopieren"}
                  </Button>
                </div>
                <div className="text-xs text-neutral-600">
                  Tipp: Sie können Standard-Filter via URL setzen, z.B. <span className="font-mono">{embedUrl}?saleType=leasing</span>
                </div>
                <pre className="max-h-[260px] overflow-auto rounded-2xl border border-neutral-200/60 bg-white p-3 text-xs text-neutral-800 whitespace-pre-wrap break-words">
                  {embedSnippet}
                </pre>
              </div>
            ) : (
              <div className="rounded-2xl border border-amber-200/70 bg-amber-50/60 p-4">
                <div className="flex items-start gap-3">
                  <Lock className="h-4 w-4 text-amber-700 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-amber-900">
                      Website-Tools ab {GARAGE_PLANS.growth.name}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
                      Mit {GARAGE_PLANS.growth.name} binden Sie Ihr Inventar und den
                      Eintauschwert-Rechner als Widget direkt auf Ihrer eigenen Website ein –
                      ein Snippet einfügen, fertig.
                    </p>
                    <Button asChild className="mt-3 rounded-2xl" size="sm">
                      <Link href="/garage-plan?redirect=/dashboard/garage">
                        Paket ansehen
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 p-4 text-sm text-neutral-700">
            Speichern Sie zuerst Ihre <span className="font-semibold">Profil-URL</span> (Slug). Danach erscheint hier Ihr öffentlicher Profil-Link und der Embed-Code.
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => void handleSaveProfile()}
          className="rounded-2xl px-8"
          disabled={profileSaving || !canSaveProfile}
          size="lg"
        >
          {profileSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Speichern…
            </>
          ) : (
            "Profil-Daten speichern"
          )}
        </Button>
      </div>
    </div>
  );
}