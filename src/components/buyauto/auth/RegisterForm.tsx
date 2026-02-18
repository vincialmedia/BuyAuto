"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, User, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { registerSchema, type RegisterFormData } from "@/lib/buyauto/schemas";
import { cn } from "@/lib/utils";

interface RegisterFormProps {
  onRegister: (data: RegisterFormData) => void;
  onShowLogin: () => void;
  isLoading: boolean;
}

export default function RegisterForm({ 
  onRegister, 
  onShowLogin, 
  isLoading 
}: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: "private",
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const selectedAccountType = form.watch("accountType");

  const onSubmit = (data: RegisterFormData) => {
    onRegister(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Account Type Selection */}
        <FormField
          control={form.control}
          name="accountType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-neutral-700 font-medium">Kontotyp</FormLabel>
              <FormControl>
                <div className="grid grid-cols-2 gap-3">
                  {/* Private User Card */}
                  <button
                    type="button"
                    onClick={() => field.onChange("private")}
                    disabled={isLoading}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
                      selectedAccountType === "private"
                        ? "border-red-500 bg-red-50 shadow-lg shadow-red-500/20"
                        : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md"
                    )}
                  >
                    <User className={cn(
                      "h-8 w-8 mb-2",
                      selectedAccountType === "private" ? "text-red-500" : "text-neutral-400"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      selectedAccountType === "private" ? "text-red-600" : "text-neutral-700"
                    )}>
                      Privatkunde
                    </span>
                    {selectedAccountType === "private" && (
                      <div className="absolute top-2 right-2 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>

                  {/* Garage Card */}
                  <button
                    type="button"
                    onClick={() => field.onChange("garage")}
                    disabled={isLoading}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200",
                      selectedAccountType === "garage"
                        ? "border-red-500 bg-red-50 shadow-lg shadow-red-500/20"
                        : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md"
                    )}
                  >
                    <Building2 className={cn(
                      "h-8 w-8 mb-2",
                      selectedAccountType === "garage" ? "text-red-500" : "text-neutral-400"
                    )} />
                    <span className={cn(
                      "text-sm font-medium",
                      selectedAccountType === "garage" ? "text-red-600" : "text-neutral-700"
                    )}>
                      Garage/Händler
                    </span>
                    {selectedAccountType === "garage" && (
                      <div className="absolute top-2 right-2 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </button>
                </div>
              </FormControl>
              <FormMessage className="text-red-500 text-sm" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
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
            control={form.control}
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
          control={form.control}
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
          control={form.control}
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

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-neutral-700 font-medium">Passwort bestätigen</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder="Passwort wiederholen"
                  className="h-11 border-neutral-300 focus:border-red-500 focus:ring-red-500/20"
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage className="text-red-500 text-sm" />
            </FormItem>
          )}
        />

        <div className="flex items-start gap-3 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <Checkbox
            id="newsletter-consent-register"
            checked={form.watch("newsletterConsent") || false}
            onCheckedChange={(checked) => form.setValue("newsletterConsent", checked as boolean)}
            disabled={isLoading}
            className="mt-0.5 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
          />
          <label
            htmlFor="newsletter-consent-register"
            className="text-sm text-neutral-700 cursor-pointer leading-tight flex-1"
          >
            Ich möchte Informationen und Angebote per E-Mail erhalten.
          </label>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 transition-all duration-300 hover:-translate-y-0.5"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wird erstellt...
            </>
          ) : (
            "Konto erstellen"
          )}
        </Button>

        <p className="text-center text-sm text-neutral-600">
          Schon registriert?{" "}
          <button
            type="button"
            onClick={onShowLogin}
            className="text-red-500 hover:text-red-600 font-medium transition-colors"
            disabled={isLoading}
          >
            Hier anmelden
          </button>
        </p>
      </form>
    </Form>
  );
}