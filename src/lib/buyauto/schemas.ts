import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Gültige E-Mail-Adresse eingeben"),
  password: z.string().min(1, "Passwort ist erforderlich"),
});

export const registerSchema = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email("Gültige E-Mail-Adresse eingeben"),
    password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
    confirmPassword: z.string().min(1, "Passwort bestätigen ist erforderlich"),
    newsletterConsent: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirmPassword"],
  });

export const resetPasswordSchema = z.object({
  email: z.string().email("Gültige E-Mail-Adresse eingeben"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const vehicleDataSchema = z.object({
  deal_type: z.enum(["lease_takeover", "direct_purchase"], {
    required_error: "Verkaufsart ist erforderlich",
    invalid_type_error: "Verkaufsart ist erforderlich",
  }),
  brand: z.string().min(1, "Marke ist erforderlich"),
  model: z.string().min(1, "Modell ist erforderlich"),
  year: z
    .number()
    .min(1990, "Baujahr muss mindestens 1990 sein")
    .max(new Date().getFullYear(), "Baujahr kann nicht in der Zukunft liegen"),
  km: z
    .union([
      z.number(),
      z.string().transform((val) => {
        const cleaned = val.replace(/[^0-9]/g, "");
        const num = parseInt(cleaned, 10);
        if (isNaN(num)) throw new Error("Ungültiger Kilometerstand");
        return num;
      }),
    ])
    .pipe(z.number().min(0, "Kilometerstand muss mindestens 0 sein")),
  body: z.string().refine((val) => ["Limousine", "Kombi", "SUV", "Cabrio"].includes(val), {
    message: "Bitte wählen Sie eine gültige Karosserie",
  }),
  fuel: z.string().refine((val) => ["Benzin", "Diesel", "Hybrid", "Elektro"].includes(val), {
    message: "Bitte wählen Sie einen gültigen Antrieb",
  }),
  gearbox: z.string().refine((val) => ["Automatik", "Manuell"].includes(val), {
    message: "Bitte wählen Sie ein gültiges Getriebe",
  }),
  description: z
    .string()
    .max(2000, "Beschreibung darf maximal 2000 Zeichen enthalten")
    .optional()
    .or(z.literal("")),
});

export const planSelectionSchema = z.object({
  pricing_plan: z.string().optional(),
  premium: z.boolean().optional(),
  price_paid_chf: z.number().optional(),
  payment_status: z.string().optional(),
});

export const imagesSchema = z.object({
  images: z.array(z.string()).optional(),
  cover_image_index: z.number().optional(),
});

export type VehicleDataForm = z.infer<typeof vehicleDataSchema>;
export type PlanSelectionForm = z.infer<typeof planSelectionSchema>;
export type ImagesForm = z.infer<typeof imagesSchema>;

export const vehicleFormSchema = vehicleDataSchema;
export type VehicleFormData = VehicleDataForm;
