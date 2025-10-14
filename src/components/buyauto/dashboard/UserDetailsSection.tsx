import { useState } from "react";
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
import { User, Mail, Edit2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function UserDetailsSection() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const userMetadata = user?.user_metadata || {};
  const firstName = userMetadata.first_name || "";
  const lastName = userMetadata.last_name || "";
  const email = user?.email || "";

  const getInitials = () => {
    const first = firstName.charAt(0).toUpperCase();
    const last = lastName.charAt(0).toUpperCase();
    return `${first}${last}` || email.charAt(0).toUpperCase();
  };

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      // In a real implementation, you would update user metadata here
      // For now, we'll just show an alert
      alert("Profil-Updates sind derzeit nicht verfügbar. Kontaktieren Sie den Support.");
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Fehler beim Aktualisieren des Profils");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-neutral-200/60 shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Profile Picture Placeholder */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {getInitials()}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold text-neutral-900 mb-1">
                  {firstName} {lastName}
                </h2>
                <div className="flex items-center gap-2 text-neutral-600 mb-3">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm truncate">{email}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                    Aktiv
                  </div>
                  <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    Verifiziert
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
                  >
                    <Edit2 className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Profil bearbeiten</DialogTitle>
                    <DialogDescription>
                      Aktualisieren Sie Ihre persönlichen Informationen.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-firstName">Vorname</Label>
                      <Input
                        id="edit-firstName"
                        defaultValue={firstName}
                        disabled
                        className="bg-neutral-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-lastName">Nachname</Label>
                      <Input
                        id="edit-lastName"
                        defaultValue={lastName}
                        disabled
                        className="bg-neutral-50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">E-Mail-Adresse</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        defaultValue={email}
                        disabled
                        className="bg-neutral-50"
                      />
                    </div>
                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                      <p className="text-blue-700 text-sm">
                        <strong>Hinweis:</strong> Profil-Änderungen sind derzeit nicht verfügbar. 
                        Kontaktieren Sie den Support für Updates.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsOpen(false)}
                    >
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
      </CardContent>
    </Card>
  );
}
