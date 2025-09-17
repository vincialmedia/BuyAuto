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

// Vehicle schemas (for create listing) - match actual field names used in components
// Updated to match exact database constraint values
export const vehicleDataSchema = z.object({
  brand: z.string().min(1, "Marke ist erforderlich"),
  model: z.string().min(1, "Modell ist erforderlich"),
  year: z.number().min(1990, "Baujahr muss mindestens 1990 sein").max(new Date().getFullYear(), "Baujahr kann nicht in der Zukunft liegen"),
  km: z.number().min(0, "Kilometerstand muss mindestens 0 sein").max(500000, "Kilometerstand zu hoch"),
  body: z.string().refine((val) => ["Limousine", "Kombi", "SUV", "Cabrio"].includes(val), {
    message: "Bitte wählen Sie eine gültige Karosserie"
  }),
  fuel: z.string().refine((val) => ["Benzin", "Diesel", "Hybrid", "Elektro"].includes(val), {
    message: "Bitte wählen Sie einen gültigen Antrieb"
  }),
  gearbox: z.string().refine((val) => ["Automatik", "Manuell"].includes(val), {
    message: "Bitte wählen Sie ein gültiges Getriebe"
  }),
});

export const planSelectionSchema = z.object({
  plan: z.string().optional(),
  price: z.number().optional(),
  price_plan: z.string().optional(),
  duration_days: z.number().optional(),
  plan_price: z.number().optional(),
  is_premium: z.boolean().optional(),
});

export const imagesSchema = z.object({
  images: z.array(z.string()).optional(),
  cover_image_index: z.number().optional(),
});

export type VehicleDataForm = z.infer<typeof vehicleDataSchema>;
export type PlanSelectionForm = z.infer<typeof planSelectionSchema>;
export type ImagesForm = z.infer<typeof imagesSchema>;

// Keep the old name for backward compatibility
export const vehicleFormSchema = vehicleDataSchema;
export type VehicleFormData = VehicleDataForm;