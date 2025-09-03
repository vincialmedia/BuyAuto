
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
export const vehicleDataSchema = z.object({
  brand: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional(),
  mileage: z.number().optional(),
  km: z.string().optional(),
  fuel: z.string().optional(),
  transmission: z.string().optional(),
  gearbox: z.string().optional(),
  power: z.number().optional(),
  color: z.string().optional(),
  body: z.string().optional(),
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