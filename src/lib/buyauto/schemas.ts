
import { z } from "zod";

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("Gültige E-Mail-Adresse eingeben"),
  password: z.string().min(1, "Passwort ist erforderlich"),
});

export const registerSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Gültige E-Mail-Adresse eingeben"),
  password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
  confirmPassword: z.string().min(1, "Passwort bestätigen ist erforderlich"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Gültige E-Mail-Adresse eingeben"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Vehicle schemas
export const vehicleFormSchema = z.object({
  brand: z.string().min(1, "Marke ist erforderlich"),
  model: z.string().min(1, "Modell ist erforderlich"),
  year: z.number().min(1900, "Ungültiges Jahr").max(new Date().getFullYear() + 2, "Jahr liegt in der Zukunft"),
  mileage: z.number().min(0, "Kilometerstand muss positiv sein"),
  fuel: z.string().min(1, "Kraftstoffart ist erforderlich"),
  transmission: z.string().min(1, "Getriebe ist erforderlich"),
  power: z.number().min(1, "Leistung ist erforderlich"),
  color: z.string().min(1, "Farbe ist erforderlich"),
});

export type VehicleFormData = z.infer<typeof vehicleFormSchema>;