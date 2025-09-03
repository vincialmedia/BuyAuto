
import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Shield, 
  AlertTriangle,
  ExternalLink
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function AccountSection() {
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    try {
      setIsUpdating(true);
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) throw error;

      alert('Passwort-Reset-Link wurde an Ihre E-Mail-Adresse gesendet!');
    } catch (error) {
      console.error('Error sending password reset:', error);
      alert('Fehler beim Senden des Reset-Links');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // In a real app, you'd implement account deletion
      // This might involve deleting user data and the auth account
      alert('Kontolöschung ist noch nicht implementiert. Kontaktieren Sie den Support.');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Fehler beim Löschen des Kontos');
    }
  };

  const userMetadata = user?.user_metadata || {};
  const firstName = userMetadata.first_name || '';
  const lastName = userMetadata.last_name || '';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Konto-Einstellungen</h2>
        <p className="text-neutral-600">
          Verwalten Sie Ihre persönlichen Informationen und Sicherheitseinstellungen.
        </p>
      </div>

      {/* Profile Information */}
      <Card className="border-neutral-200/60">
        <CardHeader>
          <CardTitle className="flex items-center text-neutral-900">
            <User className="w-5 h-5 mr-2" />
            Profil-Informationen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Vorname</Label>
              <Input
                id="firstName"
                value={firstName}
                disabled
                className="bg-neutral-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nachname</Label>
              <Input
                id="lastName"
                value={lastName}
                disabled
                className="bg-neutral-50"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail-Adresse</Label>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-neutral-400" />
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-neutral-50"
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <p className="text-blue-700 text-sm">
              <strong>Hinweis:</strong> Profil-Informationen können derzeit nicht direkt bearbeitet werden. 
              Kontaktieren Sie den Support für Änderungen.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="border-neutral-200/60">
        <CardHeader>
          <CardTitle className="flex items-center text-neutral-900">
            <Shield className="w-5 h-5 mr-2" />
            Sicherheit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-medium text-neutral-900">Passwort ändern</h4>
              <p className="text-sm text-neutral-600">
                Erhalten Sie einen Link zum Zurücksetzen Ihres Passworts per E-Mail.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handlePasswordReset}
              disabled={isUpdating}
              className="bg-transparent hover:bg-blue-50 border-blue-200 text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              {isUpdating ? 'Wird gesendet...' : 'Reset-Link senden'}
            </Button>
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-medium text-neutral-900">Konto-Status</h4>
              <p className="text-sm text-neutral-600">
                Ihr Konto ist aktiv und verifiziert.
              </p>
            </div>
            <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
              Aktiv
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200/60">
        <CardHeader>
          <CardTitle className="flex items-center text-red-700">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Gefahrenbereich
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-neutral-900 mb-2">Konto löschen</h4>
              <p className="text-sm text-neutral-600 mb-4">
                Wenn Sie Ihr Konto löschen, werden alle Ihre Daten dauerhaft entfernt. 
                Dies beinhaltet alle Ihre Inserate, Nachrichten und Kontoinformationen. 
                Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-transparent hover:bg-red-50 border-red-300 text-red-600 hover:text-red-700"
                  >
                    Konto löschen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-700">
                      Konto dauerhaft löschen?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Diese Aktion kann nicht rückgängig gemacht werden. Dadurch werden:
                      <ul className="list-disc ml-6 mt-2 space-y-1">
                        <li>Ihr Benutzerkonto dauerhaft gelöscht</li>
                        <li>Alle Ihre Inserate entfernt</li>
                        <li>Alle gespeicherten Daten gelöscht</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Ja, Konto löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="border-neutral-200/60">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900">Benötigen Sie Hilfe?</h3>
            <p className="text-neutral-600">
              Unser Support-Team steht Ihnen gerne zur Verfügung.
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.href = 'mailto:support@buyauto.ch'}
              className="bg-transparent hover:bg-neutral-50 border-neutral-300"
            >
              <Mail className="w-4 h-4 mr-2" />
              Support kontaktieren
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
