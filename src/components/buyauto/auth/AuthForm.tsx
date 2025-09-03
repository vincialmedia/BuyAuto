
"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";

import { 
  loginSchema, 
  registerSchema, 
  resetPasswordSchema,
  type LoginFormData, 
  type RegisterFormData, 
  type ResetPasswordFormData 
} from "@/lib/buyauto/schemas";
import authService from "@/services/authService";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (user) {
    router.push("/dashboard");
    return null;
  }

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await authService.signIn(data);
      toast.success("Erfolgreich angemeldet!");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      if (error?.message?.includes("Invalid login credentials")) {
        toast.error("Ungültige E-Mail oder Passwort");
      } else {
        toast.error("Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.");
      }
    } finally {
      setIsLoading(false);
    }
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
      setActiveTab("login");
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
      setShowResetForm(false);
    } catch (error: any) {
      console.error("Reset password error:", error);
      toast.error("Fehler beim Senden des Reset-Links. Bitte versuchen Sie es erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  if (showResetForm) {
    return (
      <Card className="bg-white/90 backdrop-blur-sm border-neutral-200/60 shadow-xl shadow-neutral-900/5">
        <CardHeader className="text-center space-y-4">
          <motion.h1 
            className="text-2xl font-bold text-neutral-900 tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Passwort zurücksetzen
          </motion.h1>
          <p className="text-neutral-600 text-sm">
            Gib deine E-Mail-Adresse ein, um einen Reset-Link zu erhalten.
          </p>
        </CardHeader>
        
        <CardContent>
          <Form {...resetForm}>
            <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
              <FormField
                control={resetForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-neutral-700 font-medium">E-Mail</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="ihre@email.com"
                        className="h-11 border-neutral-300 focus:border-red-500 focus:ring-red-500/20"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500 text-sm" />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowResetForm(false)}
                  disabled={isLoading}
                  className="flex-1 h-11 bg-transparent hover:bg-neutral-50 border-neutral-300"
                >
                  Zurück
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-11 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Reset-Link senden"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
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
            <TabsContent value="login" className="space-y-6 mt-0">
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-neutral-700 font-medium">E-Mail</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="ihre@email.com"
                              className="h-11 border-neutral-300 focus:border-red-500 focus:ring-red-500/20"
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-neutral-700 font-medium">Passwort</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="Ihr Passwort"
                                className="h-11 border-neutral-300 focus:border-red-500 focus:ring-red-500/20 pr-10"
                                disabled={isLoading}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-11 px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-neutral-500" />
                                ) : (
                                  <Eye className="h-4 w-4 text-neutral-500" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-between items-center pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setShowResetForm(true)}
                        className="text-sm text-neutral-600 hover:text-red-500 p-0 h-auto"
                        disabled={isLoading}
                      >
                        Passwort vergessen?
                      </Button>
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 hover:-translate-y-0.5"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Anmelden
                    </Button>

                    <p className="text-center text-sm text-neutral-600">
                      Noch kein Konto?{" "}
                      <button
                        type="button"
                        onClick={() => setActiveTab("register")}
                        className="text-red-500 hover:text-red-600 font-medium transition-colors"
                        disabled={isLoading}
                      >
                        Jetzt registrieren
                      </button>
                    </p>
                  </form>
                </Form>
              </motion.div>
            </TabsContent>

            <TabsContent value="register" className="space-y-6 mt-0">
              <motion.div
                key="register"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral-700 font-medium">Vorname</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Max"
                                className="h-11 border-neutral-300 focus:border-red-500 focus:ring-red-500/20"
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage className="text-red-500 text-sm" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-neutral-700 font-medium">Nachname</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Muster"
                                className="h-11 border-neutral-300 focus:border-red-500 focus:ring-red-500/20"
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage className="text-red-500 text-sm" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-neutral-700 font-medium">E-Mail</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="max@beispiel.com"
                              className="h-11 border-neutral-300 focus:border-red-500 focus:ring-red-500/20"
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-neutral-700 font-medium">Passwort</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="Mindestens 8 Zeichen"
                                className="h-11 border-neutral-300 focus:border-red-500 focus:ring-red-500/20 pr-10"
                                disabled={isLoading}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-11 px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLoading}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-neutral-500" />
                                ) : (
                                  <Eye className="h-4 w-4 text-neutral-500" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-500 text-sm" />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 hover:-translate-y-0.5"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Konto erstellen
                    </Button>

                    <p className="text-center text-sm text-neutral-600">
                      Schon registriert?{" "}
                      <button
                        type="button"
                        onClick={() => setActiveTab("login")}
                        className="text-red-500 hover:text-red-600 font-medium transition-colors"
                        disabled={isLoading}
                      >
                        Hier anmelden
                      </button>
                    </p>
                  </form>
                </Form>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </CardContent>
    </Card>
  );
}
