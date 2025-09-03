
import { z } from "zod";

export const vehicleDataSchema = z.object({
  brand: z.string().min(1, "Marke ist erforderlich"),
  model: z.string().min(1, "Modell ist erforderlich"),
  year: z.number()
    .min(1990, "Jahr muss mindestens 1990 sein")
    .max(new Date().getFullYear() + 1, "Jahr kann nicht in der Zukunft liegen"),
  km: z.number().min(0, "Kilometerstand muss positiv sein"),
  body: z.string().min(1, "Karosserie ist erforderlich"),
  fuel: z.string().min(1, "Antrieb ist erforderlich"),
  gearbox: z.string().min(1, "Getriebe ist erforderlich"),
});

export const leasingDetailsSchema = z.object({
  price_per_month_chf: z.number().min(1, "Monatliche Rate muss grösser als 0 sein"),
  remaining_months: z.number().min(1, "Restlaufzeit muss mindestens 1 Monat betragen"),
  deposit_chf: z.number().min(0, "Kaution muss positiv sein"),
  location: z.string().min(1, "Standort ist erforderlich"),
});

export const imagesSchema = z.object({
  images: z.array(z.string()).min(1, "Mindestens 1 Bild ist erforderlich"),
  cover_image_index: z.number().min(0),
});

export const planSelectionSchema = z.object({
  price_plan: z.string().min(1, "Plan-Auswahl ist erforderlich"),
  is_premium: z.boolean(),
  duration_days: z.number().nullable(),
  plan_price: z.number().min(0),
});

// Auth form schemas
export const loginSchema = z.object({
  email: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein"),
  password: z.string().min(1, "Passwort ist erforderlich"),
});

export const registerSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein"),
  password: z
    .string()
    .min(8, "Passwort muss mindestens 8 Zeichen lang sein")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Passwort muss mindestens einen Gross- und Kleinbuchstaben sowie eine Zahl enthalten"
    ),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export type VehicleDataForm = z.infer<typeof vehicleDataSchema>;
export type LeasingDetailsForm = z.infer<typeof leasingDetailsSchema>;
export type ImagesForm = z.infer<typeof imagesSchema>;
export type PlanSelectionForm = z.infer<typeof planSelectionSchema>;
