
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { loginSchema, type LoginFormData } from "@/lib/buyauto/schemas";

interface LoginFormProps {
  onLogin: (data: LoginFormData) => void;
  onShowRegister: () => void;
  onShowResetPassword: () => void;
  isLoading: boolean;
}

export default function LoginForm({ 
  onLogin,
  onShowRegister, 
  onShowResetPassword,
  isLoading 
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginFormData) => {
    onLogin(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        <div className="flex justify-end items-center pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onShowResetPassword}
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
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Anmelden
        </Button>

        <p className="text-center text-sm text-neutral-600">
          Noch kein Konto?{" "}
          <button
            type="button"
            onClick={onShowRegister}
            className="text-red-500 hover:text-red-600 font-medium transition-colors"
            disabled={isLoading}
          >
            Jetzt registrieren
          </button>
        </p>
      </form>
    </Form>
  );
}