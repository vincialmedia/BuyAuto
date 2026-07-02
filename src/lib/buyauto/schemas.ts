import { z } from "zod";
import { zBody, zFuel, zGearbox, zYear, zDescriptionOptional, zCantonOptional } from "@/lib/buyauto/listingContract";

export const loginSchema = z.object({
  email: z.string().email("Gültige E-Mail-Adresse eingeben"),
  password: z.string().min(1, "Passwort ist erforderlich"),
});

export const registerSchema = z
  .object({
    accountType: z.enum(["private", "garage"], {
      required_error: "Kontotyp ist erforderlich",
    }).default("private"),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email("Gültige E-Mail-Adresse eingeben"),
    password: z.string().min(8, "Passwort muss mindestens 8 Zeichen haben"),
    confirmPassword: z.string().min(1, "Passwort bestätigen ist erforderlich"),
    newsletterConsent: z.boolean().optional(),
    // Garage-specific fields
    garageName: z.string().optional(),
    city: z.string().optional(),
    contactEmail: z.preprocess(
      (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
      z.string().email("Gültige E-Mail-Adresse eingeben").optional()
    ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwörter stimmen nicht überein",
    path: ["confirmPassword"],
  })
  .refine((data) => {
    if (data.accountType === "garage") {
      return data.garageName && data.garageName.trim().length > 0;
    }
    return true;
  }, {
    message: "Garagenname ist erforderlich",
    path: ["garageName"],
  })
  .refine((data) => {
    if (data.accountType === "garage") {
      return data.city && data.city.trim().length > 0;
    }
    return true;
  }, {
    message: "Ort ist erforderlich",
    path: ["city"],
  })
  .refine((data) => {
    if (data.accountType === "garage") {
      return data.contactEmail && data.contactEmail.trim().length > 0;
    }
    return true;
  }, {
    message: "Kontakt-E-Mail ist erforderlich",
    path: ["contactEmail"],
  });

export const resetPasswordSchema = z.object({
  email: z.string().email("Gültige E-Mail-Adresse eingeben"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const numericFromString = (val: string): number => {
  const cleaned = val.replace(/[^0-9]/g, "");
  const num = parseInt(cleaned, 10);
  if (Number.isNaN(num)) {
    throw new Error("Ungültige Zahl");
  }
  return num;
};

const numberInput = z.union([z.number(), z.string().transform((val) => numericFromString(val))]);

const kmInput = z
  .union([
    z.number(),
    z.string().transform((val) => {
      const cleaned = val.replace(/[^0-9]/g, "");
      const num = parseInt(cleaned, 10);
      if (Number.isNaN(num)) throw new Error("Ungültiger Kilometerstand");
      return num;
    }),
  ])
  .pipe(z.number().min(0, "Kilometerstand muss mindestens 0 sein"));

export const vehicleDataSchema = z
  .object({
    deal_type: z.enum(["lease_takeover", "direct_purchase"], {
      required_error: "Verkaufsart ist erforderlich",
      invalid_type_error: "Verkaufsart ist erforderlich",
    }),
    brand: z.string().min(1, "Marke ist erforderlich"),
    model: z.string().min(1, "Modell ist erforderlich"),
    year: zYear,
    km: kmInput,
    purchase_price_chf: numberInput.optional(),
    body: zBody,
    fuel: zFuel,
    gearbox: zGearbox,
    description: zDescriptionOptional,
  })
  .superRefine((data, ctx) => {
    if (data.deal_type === "direct_purchase") {
      const price = data.purchase_price_chf;
      if (price === undefined || !Number.isFinite(price) || price <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["purchase_price_chf"],
          message: "Kaufpreis ist erforderlich",
        });
      }
    }
  });

export type VehicleDataForm = z.infer<typeof vehicleDataSchema>;

export const listingStep1Schema = z
  .object({
    deal_type: z.enum(["lease_takeover", "direct_purchase"], {
      required_error: "Verkaufsart ist erforderlich",
      invalid_type_error: "Verkaufsart ist erforderlich",
    }),
    brand: z.string().min(1, "Marke ist erforderlich"),
    model: z.string().min(1, "Modell ist erforderlich"),
    year: zYear,
    km: kmInput,
    body: zBody,
    fuel: zFuel,
    gearbox: zGearbox,
    description: zDescriptionOptional,

    purchase_price_chf: numberInput.optional(),

    takeover_rate_chf: numberInput.optional(),
    contract_end_date: z.date().optional(),
    remaining_months: z.number().int().min(1, "Restlaufzeit muss mindestens 1 Monat betragen").optional(),
    deposit_chf: numberInput.optional(),
    remaining_km: numberInput.optional(),
    canton_code: zCantonOptional,

    leasing_enabled: z.boolean().optional().default(false),
    interest_rate_pct: numberInput.optional(),
    down_payment_pct: numberInput.optional(),
    no_down_payment: z.boolean().optional().default(false),
    min_term_months: numberInput.optional(),
    max_term_months: numberInput.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.deal_type === "direct_purchase") {
      if (data.purchase_price_chf === undefined || !Number.isFinite(data.purchase_price_chf) || data.purchase_price_chf <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["purchase_price_chf"],
          message: "Kaufpreis ist erforderlich",
        });
      }
    }

    if (data.deal_type === "lease_takeover") {
      if (data.takeover_rate_chf === undefined || !Number.isFinite(data.takeover_rate_chf) || data.takeover_rate_chf <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["takeover_rate_chf"],
          message: "Monatliche Rate ist erforderlich",
        });
      }

      if (!(data.contract_end_date instanceof Date)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["contract_end_date"],
          message: "Vertragsende ist erforderlich",
        });
      }

      if (data.remaining_months === undefined || !Number.isFinite(data.remaining_months) || data.remaining_months < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["remaining_months"],
          message: "Restlaufzeit ist erforderlich",
        });
      }
    }

    if (data.leasing_enabled) {
      if (data.interest_rate_pct === undefined || !Number.isFinite(data.interest_rate_pct) || data.interest_rate_pct <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["interest_rate_pct"],
          message: "Leasingzins ist erforderlich",
        });
      }

      if (data.down_payment_pct === undefined || !Number.isFinite(data.down_payment_pct)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["down_payment_pct"],
          message: "Mindestanzahlung ist erforderlich",
        });
      } else if (data.down_payment_pct < 0 || data.down_payment_pct > 40) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["down_payment_pct"],
          message: "Bitte zwischen 0 und 40 eingeben",
        });
      }

      if (data.min_term_months === undefined || !Number.isFinite(data.min_term_months)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["min_term_months"],
          message: "Mindestlaufzeit ist erforderlich",
        });
      }

      if (data.max_term_months === undefined || !Number.isFinite(data.max_term_months)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["max_term_months"],
          message: "Maximallaufzeit ist erforderlich",
        });
      }

      if (
        data.min_term_months !== undefined &&
        data.max_term_months !== undefined &&
        Number.isFinite(data.min_term_months) &&
        Number.isFinite(data.max_term_months) &&
        data.min_term_months > data.max_term_months
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["max_term_months"],
          message: "Maximallaufzeit muss >= Mindestlaufzeit sein",
        });
      }
    }
  });

export type ListingStep1Form = z.infer<typeof listingStep1Schema>;

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

export type PlanSelectionForm = z.infer<typeof planSelectionSchema>;
export type ImagesForm = z.infer<typeof imagesSchema>;

export const vehicleFormSchema = vehicleDataSchema;
export type VehicleFormData = VehicleDataForm;