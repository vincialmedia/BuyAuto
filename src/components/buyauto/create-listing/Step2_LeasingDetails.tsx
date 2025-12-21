import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useWizard } from "./ListingWizard";
import { ChevronLeft, CalendarIcon } from "lucide-react";
import { z } from "zod";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createOrUpdateListing } from "@/services/createListingService";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { cn } from "@/lib/utils";

const swissCantons = [
  { value: "AG", label: "Aargau (AG)" },
  { value: "AI", label: "Appenzell Innerrhoden (AI)" },
  { value: "AR", label: "Appenzell Ausserrhoden (AR)" },
  { value: "BS", label: "Basel-Stadt (BS)" },
  { value: "BL", label: "Basel-Landschaft (BL)" },
  { value: "BE", label: "Bern (BE)" },
  { value: "FR", label: "Freiburg (FR)" },
  { value: "GE", label: "Genf (GE)" },
  { value: "GL", label: "Glarus (GL)" },
  { value: "GR", label: "Graubünden (GR)" },
  { value: "JU", label: "Jura (JU)" },
  { value: "LU", label: "Luzern (LU)" },
  { value: "NE", label: "Neuenburg (NE)" },
  { value: "NW", label: "Nidwalden (NW)" },
  { value: "OW", label: "Obwalden (OW)" },
  { value: "SH", label: "Schaffhausen (SH)" },
  { value: "SZ", label: "Schwyz (SZ)" },
  { value: "SO", label: "Solothurn (SO)" },
  { value: "SG", label: "St. Gallen (SG)" },
  { value: "TI", label: "Tessin (TI)" },
  { value: "TG", label: "Thurgau (TG)" },
  { value: "UR", label: "Uri (UR)" },
  { value: "VS", label: "Wallis (VS)" },
  { value: "VD", label: "Waadt (VD)" },
  { value: "ZG", label: "Zug (ZG)" },
  { value: "ZH", label: "Zürich (ZH)" }
];

const leasingDetailsSchema = z.object({
  price_per_month_chf: z.number().min(1, "Monatliche Rate ist erforderlich"),
  remaining_months: z.number().min(1, "Restlaufzeit muss mindestens 1 Monat betragen"),
  deposit_chf: z.number().min(0, "Kaution kann nicht negativ sein"),
  location: z.string().min(1, "Standort ist erforderlich"),
  remaining_km: z.number().min(0, "Verbleibende KM muss mindestens 0 sein").optional(),
});

type LeasingDetailsForm = z.infer<typeof leasingDetailsSchema>;

// Utility function to calculate months between two dates
const calculateRemainingMonths = (endDate: Date): number => {
  const now = new Date();
  const nowYear = now.getFullYear();
  const nowMonth = now.getMonth();
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth();
  
  let months = (endYear - nowYear) * 12 + (endMonth - nowMonth);
  
  // If the end date's day is less than today's day, subtract one month
  // For example: today is Jan 15, end date is Feb 10 -> only counts as 0 full months
  if (endDate.getDate() < now.getDate()) {
    months -= 1;
  }
  
  return months < 0 ? 0 : months;
};

export default function Step2_LeasingDetails() {
  const { data, updateData, nextStep, prevStep } = useWizard();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdatingListing, setIsUpdatingListing] = useState(false);
  const [contractEndDate, setContractEndDate] = useState<Date | undefined>(undefined);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<LeasingDetailsForm>({
    resolver: zodResolver(leasingDetailsSchema),
    defaultValues: {
      price_per_month_chf: data.price_per_month_chf || 0,
      remaining_months: data.remaining_months || 12,
      deposit_chf: data.deposit_chf || 0,
      location: data.location || "",
      remaining_km: data.remaining_km || 0,
    },
  });

  const onSubmit = async (formData: LeasingDetailsForm) => {
    if (!user) {
      toast({
        title: "Nicht angemeldet",
        description: "Sie müssen angemeldet sein.",
        variant: "destructive",
      });
      return;
    }

    // ✅ Fixed: Add proper validation for listing ID
    if (!data.id) {
      console.log("❌ No listing ID found in wizard data", data);
      toast({
        title: "Fehler",
        description: "Keine Inserat-ID gefunden. Bitte gehen Sie zurück zu Schritt 1 und versuchen Sie es erneut.",
        variant: "destructive",
      });
      return;
    }

    console.log('Step2 onSubmit - leasing details:', formData);
    setIsUpdatingListing(true);

    try {
      const updatePayload = {
        id: data.id, // ✅ Ensure ID is included
        price_per_month_chf: parseFloat(formData.price_per_month_chf.toString()),
        remaining_months: parseInt(formData.remaining_months.toString()),
        deposit_chf: formData.deposit_chf ? parseFloat(formData.deposit_chf.toString()) : null,
        location: formData.location,
        canton_code: formData.location,
        // ✅ REMOVED: title: formData.location (this was causing the bug)
        remaining_km: formData.remaining_km ? parseInt(formData.remaining_km.toString()) : null,
      };

      console.log('🚀 Step2: Updating listing with payload:', updatePayload);
      
      const result = await createOrUpdateListing(updatePayload, user);
      
      // Update wizard data with the response
      updateData({ 
        ...updatePayload,
        id: result.id // Ensure ID is maintained
      });

      toast({
        title: "Leasing-Details gespeichert",
        description: "Ihre Leasing-Informationen wurden erfolgreich gespeichert.",
      });

      nextStep();
    } catch (error) {
      console.error("Error saving leasing details:", error);
      toast({
        title: "Fehler",
        description: "Leasing-Details konnten nicht gespeichert werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingListing(false);
    }
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
  };

  const handleCantonSelect = (value: string) => {
    setValue("location", value);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setContractEndDate(date);
    if (date) {
      const months = calculateRemainingMonths(date);
      setValue("remaining_months", months, { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">
          Leasingdetails
        </h2>
        <p className="text-neutral-600 font-light leading-relaxed">
          Konditionen und Standort Ihres Fahrzeugs
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Price */}
          <div className="space-y-2">
            <Label htmlFor="price_per_month_chf" className="text-sm font-medium text-neutral-700">
              Monatliche Rate *
            </Label>
            <div className="relative">
              <Input
                id="price_per_month_chf"
                type="number"
                step="0.01"
                {...register("price_per_month_chf", { valueAsNumber: true })}
                placeholder="z.B. 599"
                className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm pl-12"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500 font-medium">
                CHF
              </span>
            </div>
            {errors.price_per_month_chf && (
              <p className="text-sm text-red-500 font-light">{errors.price_per_month_chf.message}</p>
            )}
          </div>

          {/* Contract End Date with automatic month calculation */}
          <div className="space-y-2">
            <Label htmlFor="contract_end_date" className="text-sm font-medium text-neutral-700">
              Vertragsende *
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white border border-neutral-200/40 hover:border-neutral-300 hover:bg-white focus:border-red-500 transition-colors shadow-sm",
                    !contractEndDate && "text-neutral-500"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {contractEndDate ? (
                    format(contractEndDate, "PPP", { locale: de })
                  ) : (
                    <span>Datum auswählen...</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={contractEndDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  locale={de}
                />
              </PopoverContent>
            </Popover>
            {contractEndDate && (
              <div className="flex items-center gap-2 text-sm">
                <div className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-md border border-green-200/40">
                  <span className="font-medium">
                    {watch("remaining_months") || 0} {watch("remaining_months") === 1 ? "Monat" : "Monate"} Restlaufzeit
                  </span>
                </div>
              </div>
            )}
            <p className="text-xs text-neutral-500 font-light">
              Wählen Sie das Enddatum Ihres Leasingvertrags. Die Restlaufzeit wird automatisch berechnet.
            </p>
            {errors.remaining_months && (
              <p className="text-sm text-red-500 font-light">{errors.remaining_months.message}</p>
            )}
          </div>

          {/* Deposit */}
          <div className="space-y-2">
            <Label htmlFor="deposit_chf" className="text-sm font-medium text-neutral-700">
              Kaution
            </Label>
            <div className="relative">
              <Input
                id="deposit_chf"
                type="number"
                step="0.01"
                {...register("deposit_chf", { valueAsNumber: true })}
                placeholder="z.B. 2000 (optional)"
                className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm pl-12"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500 font-medium">
                CHF
              </span>
            </div>
            {errors.deposit_chf && (
              <p className="text-sm text-red-500 font-light">{errors.deposit_chf.message}</p>
            )}
          </div>

          {/* Remaining KM */}
          <div className="space-y-2">
            <Label htmlFor="remaining_km" className="text-sm font-medium text-neutral-700">
              Verbleibende KM
            </Label>
            <div className="relative">
              <Input
                id="remaining_km"
                type="number"
                min="0"
                {...register("remaining_km", { valueAsNumber: true })}
                placeholder="z.B. 15000 (optional)"
                className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500 font-light">
                km
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-light">
              Wie viele Kilometer sind im Leasingvertrag noch verfügbar?
            </p>
            {errors.remaining_km && (
              <p className="text-sm text-red-500 font-light">{errors.remaining_km.message}</p>
            )}
          </div>

          {/* Location - Swiss Cantons Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-sm font-medium text-neutral-700">
              Standort *
            </Label>
            <Select onValueChange={handleCantonSelect} value={watch("location")}>
              <SelectTrigger className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm">
                <SelectValue placeholder="Kanton auswählen..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {swissCantons.map((canton) => (
                  <SelectItem key={canton.value} value={canton.value}>
                    {canton.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-neutral-500 font-light">
              Wählen Sie den Kanton, in dem das Fahrzeug abgeholt werden kann
            </p>
            {errors.location && (
              <p className="text-sm text-red-500 font-light">{errors.location.message}</p>
            )}
          </div>
        </div>

        {/* Preview Card */}
        <div className="bg-gradient-to-br from-neutral-50 to-red-50/30 rounded-lg p-6 border border-neutral-200/40">
          <h3 className="text-lg font-medium text-neutral-900 mb-4 tracking-tight">Übersicht</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center p-3 bg-white/60 rounded-lg border border-neutral-200/30">
              <p className="text-neutral-500 mb-1 font-light">Monatlich</p>
              <p className="text-xl font-semibold text-neutral-900">
                CHF {watch("price_per_month_chf") ? formatCurrency(watch("price_per_month_chf").toString()) : "0"}
              </p>
            </div>
            <div className="text-center p-3 bg-white/60 rounded-lg border border-neutral-200/30">
              <p className="text-neutral-500 mb-1 font-light">Restlaufzeit</p>
              <p className="text-xl font-semibold text-neutral-900">
                {watch("remaining_months") || 0} Monate
              </p>
            </div>
            <div className="text-center p-3 bg-white/60 rounded-lg border border-neutral-200/30">
              <p className="text-neutral-500 mb-1 font-light">Standort</p>
              <p className="text-lg font-semibold text-neutral-900">
                {watch("location") ? 
                  swissCantons.find(c => c.value === watch("location"))?.label.split(" (")[0] || watch("location")
                  : "Nicht ausgewählt"
                }
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <Button
            type="button"
            onClick={prevStep}
            variant="outline"
            className="px-6 py-3 bg-transparent hover:bg-neutral-50 border-neutral-200/40 text-neutral-600 rounded-lg transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          
          <Button
            type="submit"
            disabled={isUpdatingListing}
            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdatingListing ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Speichere Details...
              </>
            ) : (
              "Weiter zu Plan-Auswahl"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
