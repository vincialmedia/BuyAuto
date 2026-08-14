import { useEffect, useMemo, useState } from "react";
import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { LocationAutocomplete } from "@/components/buyauto/create-listing/step1/LocationAutocomplete";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Garage } from "@/services/garageService";

interface GarageBasisTabProps {
  garage: Garage | null;
  onUpdate: (updates: Partial<Garage>) => Promise<void>;
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

function getSiteOrigin(): string {
  if (typeof window === "undefined") return "https://buyauto.ch";
  return window.location.origin || "https://buyauto.ch";
}

export function GarageBasisTab({ garage, onUpdate }: GarageBasisTabProps) {
  const [user, setUser] = useState<User | null>(null);

  const [draft, setDraft] = useState({
    garage_name: garage?.garage_name ?? "",
    slug: garage?.slug ?? "",
    city: garage?.city ?? "",
  });

  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<BannerState>({ kind: "idle" });

  const [resetSending, setResetSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(data.user ?? null);
    }
    void loadUser();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!garage) return;
    setDraft({
      garage_name: garage.garage_name ?? "",
      slug: garage.slug ?? "",
      city: garage.city ?? "",
    });
  }, [garage?.id]);

  useEffect(() => {
    if (slugManuallyEdited) return;
    const name = draft.garage_name.trim();
    if (!name) return;

    const generated = name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    setDraft((p) => ({ ...p, slug: generated }));
  }, [draft.garage_name, slugManuallyEdited]);

  const canSave =
    draft.garage_name.trim().length >= 2 &&
    draft.slug.trim().length >= 2;

  const mapsPreviewUrl = useMemo(() => {
    const q = draft.city?.trim();
    if (!q) return "";
    const query = encodeURIComponent(`${q}, Switzerland`);
    return `https://www.google.com/maps?q=${query}&output=embed`;
  }, [draft.city]);

  async function handleSave() {
    setBanner({ kind: "idle" });
    setSaving(true);
    try {
      await onUpdate({
        garage_name: draft.garage_name.trim(),
        slug: draft.slug.trim(),
        city: draft.city.trim() || null,
      });
      setBanner({ kind: "success", message: "Basis-Daten gespeichert." });
    } catch (e) {
      setBanner({ kind: "error", message: `Speichern fehlgeschlagen: ${getErrorMessage(e)}` });
    } finally {
      setSaving(false);
    }
  }

  async function handleSendPasswordReset() {
    setBanner({ kind: "idle" });

    const email = user?.email;
    if (!email) {
      setBanner({ kind: "error", message: "Kein Login-E-Mail gefunden. Bitte erneut einloggen." });
      return;
    }

    setResetSending(true);
    try {
      // Same canonical marker as authService.resetPassword — auth.tsx only
      // recognizes type=recovery (plus the PASSWORD_RECOVERY event).
      const redirectTo = `${getSiteOrigin()}/auth?type=recovery`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;

      setBanner({ kind: "success", message: "Passwort-Reset E-Mail wurde gesendet." });
    } catch (e) {
      setBanner({ kind: "error", message: `Passwort-Reset fehlgeschlagen: ${getErrorMessage(e)}` });
    } finally {
      setResetSending(false);
    }
  }

  return (
    <div className="rounded-3xl border border-neutral-200/60 bg-white shadow-sm p-4 sm:p-6 space-y-4">
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

      <div>
        <h2 className="text-lg font-bold tracking-tight text-neutral-900">Basis-Informationen</h2>
        <p className="text-sm text-neutral-600 mt-1">Name, URL und Standort</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="garage_name">Garagenname *</Label>
          <Input
            id="garage_name"
            value={draft.garage_name}
            onChange={(e) => setDraft((p) => ({ ...p, garage_name: e.target.value }))}
            placeholder="z.B. Garage Muster AG"
            className="rounded-2xl"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="slug">
            Profil-URL * <span className="text-xs text-neutral-500">(buyauto.ch/{draft.slug || "ihr-name"})</span>
          </Label>
          <Input
            id="slug"
            value={draft.slug}
            onChange={(e) => {
              setSlugManuallyEdited(true);
              setDraft((p) => ({ ...p, slug: e.target.value }));
            }}
            placeholder="z.B. garage-muster"
            className="rounded-2xl"
          />
          <p className="text-xs text-neutral-500">Nur Kleinbuchstaben, Zahlen und Bindestriche</p>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="city">Standort</Label>
          <LocationAutocomplete
            value={draft.city}
            onValueChange={(next) => setDraft((p) => ({ ...p, city: next }))}
            placeholder="z.B. Zürich"
            inputClassName="rounded-2xl"
          />
          <p className="text-xs text-neutral-500">Dieser Standort wird als Standard für zukünftige Inserate verwendet.</p>

          {mapsPreviewUrl ? (
            <div className="mt-3 overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm">
              <div className="aspect-[16/10] w-full bg-neutral-100">
                <iframe
                  title="Standort Vorschau"
                  src={mapsPreviewUrl}
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
        <Button
          onClick={() => void handleSave()}
          className="rounded-2xl px-8"
          disabled={saving || !canSave}
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Speichern…
            </>
          ) : (
            "Basis-Daten speichern"
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => void handleSendPasswordReset()}
          disabled={resetSending}
          className="rounded-2xl"
        >
          {resetSending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sende…
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Passwort zurücksetzen
            </>
          )}
        </Button>
      </div>
    </div>
  );
}