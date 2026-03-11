import { z } from "zod";

export const leaseTakeoverFinancingSchema = z.object({
  price_per_month_chf: z.number().min(1, "Monatliche Rate ist erforderlich"),
  remaining_months: z.number().min(1, "Restlaufzeit muss mindestens 1 Monat betragen"),
  deposit_chf: z.number().min(0, "Kaution kann nicht negativ sein"),
  remaining_km: z.number().min(0, "Verbleibende KM muss mindestens 0 sein").optional(),
});

export type LeaseTakeoverFinancingForm = z.infer<typeof leaseTakeoverFinancingSchema>;