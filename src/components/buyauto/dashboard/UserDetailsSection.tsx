import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Camera, EyeOff, Mail, Pencil } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { uploadOptimizedImage } from "@/services/storageService";
import { toast } from "sonner";

function safeString(input: unknown): string {
  return typeof input === "string" ? input : "";
}

function getInitials(firstName: string, lastName: string, email: string): string {
  const first = firstName.trim().charAt(0).toUpperCase();
  const last = lastName.trim().charAt(0).toUpperCase();
  const fallback = email.trim().charAt(0).toUpperCase();
  const out = `${first}${last}`.trim();
  return out || fallback || "U";
}

export default function UserDetailsSection() {
  const { user, profile, refreshProfile } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const userMetadata = user?.user_metadata || {};
  const email = user?.email || "";

  const initialFirstName = safeString((userMetadata as any).first_name);
  const initialLastName = safeString((userMetadata as any).last_name);

  const [firstName, setFirstName] = useState(initialFirstName);
  const [lastName, setLastName] = useState(initialLastName);

  const avatarUrl = useMemo(() => {
    const raw = (profile as any)?.avatar_url;
    return typeof raw === "string" && raw ? raw : null;
  }, [profile]);

  const showNamePublicly = (profile as any)?.show_name_publicly !== false;
  const hasPublicName = Boolean(safeString((profile as any)?.full_name).trim());

  useEffect(() => {
    if (!isOpen) {
      setFirstName(initialFirstName);
      setLastName(initialLastName);
    }
  }, [isOpen, initialFirstName, initialLastName]);

  const initials = getInitials(firstName || initialFirstName, lastName || initialLastName, email);

  const handlePickAvatar = () => {
    fileInputRef.current?.click();
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    const userId = user?.id;
    if (!userId) throw new Error("Nicht angemeldet.");

    const path = `avatars/${userId}`;
    const result = await uploadOptimizedImage(file, "listing-images", path, undefined);

    return result.mainUrl;
  };

  const handleAvatarSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!file) return;

    if (!user) {
      toast.error("Bitte zuerst anmelden.");
      return;
    }

    setIsUpdating(true);
    try {
      const newUrl = await uploadAvatar(file);

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: newUrl })
        .eq("id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success("Profilbild aktualisiert.");
    } catch (err) {
      console.error("Avatar upload error:", err);
      toast.error("Fehler beim Hochladen des Profilbilds.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    const nextFirst = firstName.trim();
    const nextLast = lastName.trim();

    setIsUpdating(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: nextFirst,
          last_name: nextLast,
        },
      });

      if (authError) throw authError;

      const fullName = `${nextFirst} ${nextLast}`.trim() || null;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);

      if (profileError) throw profileError;

      await refreshProfile();
      toast.success("Profil gespeichert.");
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Fehler beim Aktualisieren des Profils.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleAnonymous = async (anonymous: boolean) => {
    if (!user) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ show_name_publicly: !anonymous })
        .eq("id", user.id);

      if (error) throw error;

      await refreshProfile();
      toast.success(
        anonymous
          ? "Du wirst auf deinen Inseraten als «Privatanbieter» angezeigt."
          : hasPublicName
            ? "Dein Name wird jetzt auf deinen Inseraten angezeigt."
            : "Sobald du deinen Namen ergänzt, wird er auf deinen Inseraten angezeigt."
      );
    } catch (err) {
      console.error("Error updating seller visibility:", err);
      toast.error("Fehler beim Speichern der Einstellung.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) {
      toast.error("Keine E-Mail-Adresse gefunden.");
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      toast.success("Passwort-Reset-Link wurde an deine E-Mail-Adresse gesendet.");
    } catch (error) {
      console.error("Error sending password reset:", error);
      toast.error("Fehler beim Senden des Reset-Links.");
    } finally {
      setIsUpdating(false);
    }
  };

  const displayFirstName = safeString((user?.user_metadata as any)?.first_name);
  const displayLastName = safeString((user?.user_metadata as any)?.last_name);
  const displayName = `${displayFirstName} ${displayLastName}`.trim() || email;

  return (
    <Card className="border-neutral-200/60 shadow-sm rounded-3xl">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative">
            <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Profilbild" fill className="object-cover" sizes="80px" />
              ) : (
                initials
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleAvatarSelected}
              disabled={isUpdating}
            />

            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-sm"
              onClick={handlePickAvatar}
              disabled={isUpdating}
              aria-label="Profilbild ändern"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold tracking-tight text-neutral-900 mb-1 truncate">
                  {displayName}
                </h2>
                <div className="flex items-center gap-2 text-neutral-600 mb-3">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm truncate">{email}</span>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-2xl"
                    onClick={handlePasswordReset}
                    disabled={isUpdating || !email}
                  >
                    Passwort zurücksetzen
                  </Button>
                </div>
              </div>

              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-2xl"
                    aria-label="Profil bearbeiten"
                  >
                    <Pencil className="w-5 h-5" />
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[480px] rounded-3xl">
                  <DialogHeader>
                    <DialogTitle>Profil bearbeiten</DialogTitle>
                    <DialogDescription>Aktualisiere deine persönlichen Informationen.</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="edit-firstName">Vorname</Label>
                      <Input
                        id="edit-firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={isUpdating}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-lastName">Nachname</Label>
                      <Input
                        id="edit-lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={isUpdating}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-email">E-Mail-Adresse</Label>
                      <Input id="edit-email" type="email" value={email} disabled className="bg-neutral-50" />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isUpdating}>
                      Abbrechen
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={isUpdating}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      {isUpdating ? "Wird gespeichert..." : "Änderungen speichern"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-neutral-200/60 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600 shrink-0">
                <EyeOff className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <Label htmlFor="anonymous-seller-toggle" className="text-sm font-semibold text-neutral-900">
                  Als «Privatanbieter» anzeigen
                </Label>
                <p className="mt-1 text-sm text-neutral-600">
                  Verbirgt deinen Namen und dein Profilbild auf deinen Inseraten. Interessenten sehen
                  stattdessen «Privatanbieter».
                </p>
                {showNamePublicly && !hasPublicName && (
                  <p className="mt-2 text-xs text-amber-600">
                    Noch kein Name hinterlegt – deine Inserate zeigen «Privatanbieter», bis du deinen
                    Namen über «Profil bearbeiten» ergänzt.
                  </p>
                )}
              </div>
            </div>
            <Switch
              id="anonymous-seller-toggle"
              checked={!showNamePublicly}
              onCheckedChange={handleToggleAnonymous}
              disabled={isUpdating}
              aria-label="Als Privatanbieter anzeigen"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}