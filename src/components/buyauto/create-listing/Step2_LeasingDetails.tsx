import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWizard } from "./ListingWizard";
import { ChevronLeft } from "lucide-react";
import { z } from "zod";
import { useState } from "react"; // ✅ ADD: useState import
import { useAuth } from "@/contexts/AuthContext"; // ✅ ADD: useAuth import
import { useToast } from "@/hooks/use-toast"; // ✅ ADD: useToast import
import { supabase } from "@/integrations/supabase/client"; // ✅ ADD: supabase import

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
});

type LeasingDetailsForm = z.infer<typeof leasingDetailsSchema>;

export default function Step2_LeasingDetails() {
  const { data, updateData, nextStep, prevStep } = useWizard();
  const { user } = useAuth(); // ✅ ADD: Get user for auth checks
  const { toast } = useToast(); // ✅ ADD: Toast notifications
  const [isUpdatingListing, setIsUpdatingListing] = useState(false); // ✅ ADD: Loading state
  
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
    },
  });

  const updateListingInDatabase = async (formData: LeasingDetailsForm) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please log in to continue.",
        variant: "destructive"
      });
      return false;
    }

    if (!data.id) {
      console.error("❌ No listing ID found in wizard data");
      toast({
        title: "Error",
        description: "Listing ID not found. Please go back to Step 1.",
        variant: "destructive"
      });
      return false;
    }

    try {
      console.log("🔄 Updating listing with leasing details:", { listingId: data.id, formData });

      const { error } = await supabase
        .from("listings")
        .update({
          price_per_month_chf: Number(formData.price_per_month_chf),
          remaining_months: Number(formData.remaining_months),
          deposit_chf: formData.deposit_chf ? Number(formData.deposit_chf) : null,
          location: formData.location
        })
        .eq("id", data.id);

      if (error) {
        console.error("❌ Error updating listing with leasing details:", error);
        throw error;
      }

      console.log("✅ Successfully updated listing with leasing details");
      return true;

    } catch (error) {
      console.error("❌ Failed to update listing with leasing details:", error);
      toast({
        title: "Error",
        description: "Failed to save leasing details. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const onSubmit = async (formData: LeasingDetailsForm) => {
    console.log("Step2 onSubmit - leasing details:", formData);
    setIsUpdatingListing(true);

    try {
      // Update the database with leasing details
      const updateSuccess = await updateListingInDatabase(formData);
      
      if (!updateSuccess) {
        // Error already handled in updateListingInDatabase
        setIsUpdatingListing(false);
        return;
      }

      // Update wizard state
      updateData(formData);
      
      toast({
        title: "Success",
        description: "Leasing details saved successfully!",
      });

      // Move to next step
      nextStep();

    } catch (error) {
      console.error("❌ Unexpected error in leasing details submission:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
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

          {/* Remaining Months */}
          <div className="space-y-2">
            <Label htmlFor="remaining_months" className="text-sm font-medium text-neutral-700">
              Restlaufzeit *
            </Label>
            <div className="relative">
              <Input
                id="remaining_months"
                type="number"
                min="1"
                {...register("remaining_months", { valueAsNumber: true })}
                placeholder="z.B. 24"
                className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500 font-light">
                Monate
              </span>
            </div>
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
            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
          >
            Weiter zu Plan-Auswahl
          </Button>
        </div>
      </form>
    </div>
  );
}
