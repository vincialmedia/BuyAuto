
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/buyauto/schemas";
import { motion } from "framer-motion";

interface ResetPasswordFormProps {
  onResetPassword: (data: ResetPasswordFormData) => void;
  onBack: () => void;
  isLoading: boolean;
}

export default function ResetPasswordForm({
  onResetPassword,
  onBack,
  isLoading
}: ResetPasswordFormProps) {
  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });
  
  const onSubmit = (data: ResetPasswordFormData) => {
    onResetPassword(data);
  };

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

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
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