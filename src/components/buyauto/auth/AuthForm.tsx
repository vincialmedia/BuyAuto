
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { queueLoginEvent, setUser, track } from "@/lib/analytics";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ResetPasswordForm from "./ResetPasswordForm";
import UpdatePasswordForm from "./UpdatePasswordForm";
import GoogleSignInButton from "./GoogleSignInButton";
import { canOfferGoogleSignIn } from "@/lib/buyauto/googleSignIn";
import authService from "@/services/authService";
import type { LoginFormData, RegisterFormData } from "@/lib/buyauto/schemas";

type AuthView = "login" | "register" | "reset-password" | "update-password";

interface AuthFormProps {
  initialView?: AuthView;
  initialAccountType?: "private" | "garage";
  /** Sanitised internal path the sign-up confirmation link returns to. */
  returnPath?: string;
}

export default function AuthForm({
  initialView = "login",
  initialAccountType,
  returnPath,
}: AuthFormProps = {}) {
  const [currentView, setCurrentView] = useState<AuthView>(initialView);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("AuthForm: Starting login process");
      
      // Ensure data matches SignInData interface
      const signInData = {
        email: data.email,
        password: data.password,
      };
      
      await authService.signIn(signInData);
      // Sent by AnalyticsProvider once the profile (role) has loaded, so an
      // admin login never reaches GA4.
      queueLoginEvent();
      console.log("AuthForm: Login successful");
      
      toast.success("Erfolgreich angemeldet!");
      
      // Don't redirect here - let the auth page handle it
      console.log("AuthForm: Login completed, waiting for auth context update");
      
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Etwas ist schiefgelaufen. Bitte versuch es nochmals.";
      
      if (error?.message?.includes("Invalid login credentials")) {
        // An account created with Google has no password until one is set.
        errorMessage = canOfferGoogleSignIn()
          ? "E-Mail oder Passwort ist falsch. Hast du dein Konto mit Google erstellt? Dann melde dich mit Google an."
          : "E-Mail oder Passwort ist falsch.";
      } else if (error?.message?.includes("Email not confirmed")) {
        errorMessage = "Bitte bestätige zuerst deine E-Mail-Adresse. Den Link findest du in unserer E-Mail.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("AuthForm: Starting registration process");
      
      // Ensure data matches SignUpData interface
      const signUpData = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        newsletterConsent: data.newsletterConsent,
        accountType: data.accountType,
        garageName: data.garageName,
        city: data.city,
        contactEmail: data.contactEmail,
        // Paths behind the auth middleware (/dashboard, /admin) would bounce the
        // link's ?code= into a nested redirect and lose the session: those go
        // through /auth, which exchanges the code and then forwards.
        ...(returnPath
          ? {
              emailRedirectTo: /^\/(dashboard|admin)(\/|\?|$)/.test(returnPath)
                ? `${window.location.origin}/auth?redirect=${encodeURIComponent(returnPath)}`
                : `${window.location.origin}${returnPath}`,
            }
          : {}),
      };
      
      await authService.signUp(signUpData);
      // signUp resolved: Supabase created the account (duplicates throw).
      const role = data.accountType === "garage" ? "dealer" : "private";
      setUser(null, role);
      track("sign_up", { method: "email" });
      // A garage registering is the dealer-partner lead (there is no separate
      // dealer lead form or table).
      if (role === "dealer") {
        track("generate_lead", { lead_type: "dealer_partner", value: 0, currency: "CHF" });
      }
      console.log("AuthForm: Registration successful");
      
      toast.success("Konto erstellt! Bestätige jetzt deine E-Mail-Adresse: Den Link haben wir dir geschickt.");
      setCurrentView("login");
      
    } catch (error: any) {
      console.error("Registration error:", error);

      const emailAlreadyExists =
        error?.code === "email_exists" ||
        error?.message?.includes("User already registered") ||
        error?.message?.includes("already been registered");

      if (emailAlreadyExists) {
        const errorMessage = "Mit dieser E-Mail gibt es schon ein Konto. Bitte melde dich an.";
        toast.error(errorMessage);
        setError(errorMessage);
        // Flip the toggle over to the login ("Einloggen") view so the user can
        // sign in right away instead of re-attempting the registration.
        setCurrentView("login");
        return;
      }

      let errorMessage = "Etwas ist schiefgelaufen. Bitte versuch es nochmals.";
      if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Google signs in on the spot (no confirmation e-mail); the auth page then
  // forwards to ?redirect= or the dashboard like after a password login.
  const handleGoogleSignedIn = ({ isNewAccount }: { isNewAccount: boolean }) => {
    toast.success(isNewAccount ? "Willkommen bei BuyAuto!" : "Erfolgreich angemeldet!");
  };

  const googleButton = (
    <GoogleSignInButton
      divider="below"
      showTerms
      disabled={isLoading}
      onSignedIn={handleGoogleSignedIn}
    />
  );

  const handleResetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      console.log("AuthForm: Starting password reset");
      
      await authService.resetPassword(email);
      console.log("AuthForm: Password reset email sent");
      
      toast.success("Wir haben dir einen Link zum Zurücksetzen deines Passworts geschickt.");
      setCurrentView("login");
      
    } catch (error: any) {
      console.error("Reset password error:", error);
      const errorMessage = "Etwas ist schiefgelaufen. Bitte versuch es nochmals.";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("AuthForm: Starting password update");
      
      await authService.updatePassword(password);
      console.log("AuthForm: Password updated successfully");
      
      toast.success("Passwort erfolgreich aktualisiert!");
      
      // Clean up the URL hash so we don't stay in recovery mode
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', window.location.pathname);
      }
      
      // Redirect to dashboard
      window.location.href = "/dashboard";
      
    } catch (error: any) {
      console.error("Update password error:", error);
      let errorMessage = "Etwas ist schiefgelaufen. Bitte versuch es nochmals.";
      if (error?.message) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (currentView === "reset-password") {
    return (
      <Card className="w-full max-w-md mx-auto shadow-xl shadow-neutral-900/5 border-neutral-200/60">
        <CardHeader className="space-y-1 text-center pb-4">
          <h1 className="text-2xl font-semibold text-neutral-900">Passwort zurücksetzen</h1>
          <p className="text-sm text-neutral-600">
            Gib deine E-Mail-Adresse ein, dann schicken wir dir einen Link für ein neues Passwort.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <ResetPasswordForm
            onResetPassword={handleResetPassword}
            onShowLogin={() => setCurrentView("login")}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    );
  }

  if (currentView === "update-password") {
    return (
      <Card className="w-full max-w-md mx-auto shadow-xl shadow-neutral-900/5 border-neutral-200/60">
        <CardHeader className="space-y-1 text-center pb-4">
          <h1 className="text-2xl font-semibold text-neutral-900">Neues Passwort</h1>
          <p className="text-sm text-neutral-600">
            Wähle ein neues, sicheres Passwort für dein Konto.
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Fehler</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <UpdatePasswordForm
            onUpdatePassword={handleUpdatePassword}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl shadow-neutral-900/5 border-neutral-200/60">
      <CardContent className="p-6 sm:p-8">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Tabs
          value={currentView}
          onValueChange={(value) => {
            setCurrentView(value as AuthView);
            setError(null);
          }}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-neutral-100 p-1">
            <TabsTrigger
              value="login"
              className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-red-500 data-[state=active]:shadow-sm"
              disabled={isLoading}
            >
              Anmelden
            </TabsTrigger>
            <TabsTrigger
              value="register"
              className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-red-500 data-[state=active]:shadow-sm"
              disabled={isLoading}
            >
              Registrieren
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-0">
            {googleButton}
            <LoginForm
              onLogin={handleLogin}
              onShowRegister={() => setCurrentView("register")}
              onShowResetPassword={() => setCurrentView("reset-password")}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="register" className="space-y-4 mt-0">
            <RegisterForm
              onRegister={handleRegister}
              onShowLogin={() => setCurrentView("login")}
              isLoading={isLoading}
              initialAccountType={initialAccountType}
              privateAccountExtra={googleButton}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}