
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ResetPasswordForm from "./ResetPasswordForm";
import authService from "@/services/authService";
import type { LoginFormData, RegisterFormData } from "@/lib/buyauto/schemas";

type AuthView = "login" | "register" | "reset-password";

export default function AuthForm() {
  const [currentView, setCurrentView] = useState<AuthView>("login");
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
      console.log("AuthForm: Login successful");
      
      toast.success("Erfolgreich angemeldet!");
      
      // Don't redirect here - let the auth page handle it
      console.log("AuthForm: Login completed, waiting for auth context update");
      
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
      
      if (error?.message?.includes("Invalid login credentials")) {
        errorMessage = "Ungültige E-Mail oder Passwort.";
      } else if (error?.message?.includes("Email not confirmed")) {
        errorMessage = "Bitte bestätigen Sie Ihre E-Mail-Adresse.";
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
      };
      
      await authService.signUp(signUpData);
      console.log("AuthForm: Registration successful");
      
      // If user consented to newsletter, subscribe them
      if (data.newsletterConsent) {
        try {
          console.log("AuthForm: User consented to newsletter, subscribing...");
          const response = await fetch("/api/newsletter/subscribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: data.email,
              consent: true,
            }),
          });

          if (!response.ok) {
            console.error("Newsletter subscription failed:", await response.text());
            // Don't block registration flow if newsletter fails
          } else {
            console.log("AuthForm: Newsletter subscription successful");
          }
        } catch (newsletterError) {
          console.error("Newsletter subscription error:", newsletterError);
          // Don't block registration flow if newsletter fails
        }
      }
      
      toast.success("Registrierung erfolgreich! Überprüfen Sie Ihre E-Mails, um Ihr Konto zu bestätigen.");
      setCurrentView("login");
      
    } catch (error: any) {
      console.error("Registration error:", error);
      let errorMessage = "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
      
      if (error?.message?.includes("User already registered")) {
        errorMessage = "Ein Konto mit dieser E-Mail-Adresse existiert bereits.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      setIsLoading(true);
      console.log("AuthForm: Starting password reset");
      
      await authService.resetPassword(email);
      console.log("AuthForm: Password reset email sent");
      
      toast.success("Passwort-Reset-Link wurde an Ihre E-Mail-Adresse gesendet.");
      setCurrentView("login");
      
    } catch (error: any) {
      console.error("Reset password error:", error);
      const errorMessage = "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.";
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
            Geben Sie Ihre E-Mail-Adresse ein, um ein neues Passwort zu erhalten.
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

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl shadow-neutral-900/5 border-neutral-200/60">
      <CardHeader className="space-y-1 text-center pb-4">
        <h1 className="text-2xl font-semibold text-neutral-900">BuyAuto</h1>
        <p className="text-sm text-neutral-600">
          Verwalten Sie Ihre Auto-Leasing-Inserate
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
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}