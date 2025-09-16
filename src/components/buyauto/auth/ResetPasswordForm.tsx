
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/buyauto/schemas";

interface ResetPasswordFormProps {
  onResetPassword: (email: string) => void;
  onShowLogin: () => void;
  isLoading: boolean;
}

export default function ResetPasswordForm({ 
  onResetPassword,
  onShowLogin,
  isLoading 
}: ResetPasswordFormProps) {
  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    onResetPassword(data.email);
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

        <div className="flex flex-col gap-4">
          <Button disabled={isLoading} type="submit" className="w-full h-11">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Link wird gesendet...
              </>
            ) : (
              "Link anfordern"
            )}
          </Button>
          <Button
            type="button"
            onClick={onShowLogin}
            variant="outline"
            className="w-full h-11 border-neutral-300 hover:bg-neutral-50"
            disabled={isLoading}
          >
            Zurück zur Anmeldung
          </Button>
        </div>
      </form>
    </Form>
  );
}