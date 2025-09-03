
"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import authService from "@/services/authService";
import { 
  type LoginFormData, 
  type RegisterFormData, 
  type ResetPasswordFormData 
} from "@/lib/buyauto/schemas";

import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ResetPasswordForm from "./ResetPasswordForm";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AuthView = "login" | "register" | "reset-password";

export default function AuthForm() {
  const router = useRouter();
  const [view, setView] = useState<AuthView>("login");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      // Sign in with Supabase
      const result = await authService.signIn({
        email: data.email,
        password: data.password
      });
      
      console.log("Login successful:", result);
      
      if (result.session) {
        toast.success("Erfolgreich angemeldet!");
        
        // Wait for the session to be established and cookies to be set
        // Then do a full page redirect to ensure middleware sees the session
        setTimeout(() => {
          const callbackUrl = router.query.callback as string || "/dashboard";
          console.log("Redirecting to:", callbackUrl);
          window.location.href = callbackUrl;
        }, 1000); // Increased wait time for session establishment
      } else {
        throw new Error("No session returned from login");
      }
      
    } catch (error: any) {
      console.error("Login error:", error);
      if (error?.message?.includes("Invalid login credentials")) {
        toast.error("Ungültige E-Mail oder Passwort");
      } else {
        toast.error("Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.");
      }
      setIsLoading(false); // Only set loading false on error
    }
    // Note: Don't set loading false on success to maintain loading state during redirect
  };

  const handleRegister = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await authService.signUp({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      toast.success("Konto erstellt! Überprüfe deine E-Mails, um dein Konto zu bestätigen.");
      setView("login");
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error?.message?.includes("User already registered")) {
        toast.error("Diese E-Mail-Adresse ist bereits registriert");
      } else {
        toast.error("Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      await authService.resetPassword(data.email);
      toast.success("Passwort-Reset-Link wurde gesendet! Überprüfe deine E-Mails.");
      setView("login");
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error("Fehler beim Senden des Reset-Links. Bitte versuchen Sie es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  if (view === "reset-password") {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="reset"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          <ResetPasswordForm
            onResetPassword={handleResetPassword}
            onBack={() => setView("login")}
            isLoading={isLoading}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-neutral-200/60 shadow-xl shadow-neutral-900/5">
      <CardHeader className="text-center space-y-4">
        <motion.h1 
          className="text-2xl font-bold text-neutral-900 tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Willkommen bei BuyAuto
        </motion.h1>
      </CardHeader>
      
      <CardContent>
        <Tabs value={view} onValueChange={(v) => setView(v as AuthView)}>
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-neutral-100 p-1 rounded-lg">
            <TabsTrigger 
              value="login"
              className="data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm transition-all duration-200"
            >
              Anmelden
            </TabsTrigger>
            <TabsTrigger 
              value="register"
              className="data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm transition-all duration-200"
            >
              Registrieren
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {view === "login" && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <LoginForm
                  onLogin={handleLogin}
                  onShowRegister={() => setView("register")}
                  onShowResetPassword={() => setView("reset-password")}
                  isLoading={isLoading}
                />
              </motion.div>
            )}
            {view === "register" && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <RegisterForm
                  onRegister={handleRegister}
                  onShowLogin={() => setView("login")}
                  isLoading={isLoading}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Tabs>
      </CardContent>
    </Card>
  );
}