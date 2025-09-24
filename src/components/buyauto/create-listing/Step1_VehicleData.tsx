import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWizard } from "./ListingWizard";
import { vehicleDataSchema, type VehicleDataForm } from "@/lib/buyauto/schemas";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const brands = [
  "Audi", "BMW", "Mercedes-Benz", "Volkswagen", "Toyota", "Honda", "Ford", 
  "Opel", "Peugeot", "Renault", "Citroën", "Volvo", "Skoda", "Hyundai", 
  "Nissan", "Mazda", "Subaru", "Lexus", "Mini", "Seat", "Fiat"
];

// ✅ FIXED: Updated to match exact database constraint values
const bodyTypes = [
  "Limousine", "Kombi", "SUV", "Cabrio"
];

// ✅ FIXED: Updated to match exact database constraint values
const fuelTypes = [
  "Benzin", "Diesel", "Hybrid", "Elektro"
];

// ✅ FIXED: Updated to match exact database constraint values
const gearboxTypes = [
  "Automatik", "Manuell"
];

export default function Step1_VehicleData() {
  const { data, updateData, nextStep } = useWizard();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreatingListing, setIsCreatingListing] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<VehicleDataForm>({
    resolver: zodResolver(vehicleDataSchema),
    defaultValues: {
      brand: data.brand || "",
      model: data.model || "",
      year: data.year || new Date().getFullYear(),
      km: data.km || 0,
      body: (data.body as "Limousine" | "Kombi" | "SUV" | "Cabrio") || "",
      fuel: (data.fuel as "Benzin" | "Diesel" | "Hybrid" | "Elektro") || "",
      gearbox: (data.gearbox as "Automatik" | "Manuell") || "",
    },
    mode: "onBlur"
  });

  const createInitialListing = async (formData: VehicleDataForm) => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "Please log in to create a listing.",
        variant: "destructive"
      });
      return null;
    }

    try {
      // Create a basic listing record with vehicle data
      const listingInsert = {
        user_id: user.id,
        brand: formData.brand,
        model: formData.model,
        year: Number(formData.year),
        mileage_km: Number(formData.km),
        fuel: formData.fuel,
        gearbox: formData.gearbox,
        body: formData.body,
        // Set default values for required fields that will be filled in later steps
        price_per_month_chf: 0, // Will be updated in Step 2
        remaining_months: 12, // Will be updated in Step 2
        location: "Wird später hinzugefügt", // ✅ FIXED: Proper placeholder instead of empty string
        canton_code: "ZH", // ✅ FIXED: Added missing required canton_code field
        title: `${formData.brand} ${formData.model}`, // Auto-generate title
        price_plan: "standard", // Default plan, will be updated in Step 3
        status: "draft", // Mark as draft until completed
        images: [],
        cover_image_index: 0,
        premium: false,
        duration_days: 30,
        created_by: user.id // ✅ ADDED: Set created_by for RLS policies
      };

      console.log("🚀 Creating initial listing with data:", listingInsert);

      const { data: newListing, error } = await supabase
        .from("listings")
        .insert(listingInsert)
        .select("id")
        .single();

      if (error) {
        console.error("❌ Error creating listing:", error);
        throw error;
      }

      console.log("✅ Successfully created listing with ID:", newListing.id);
      return newListing.id;

    } catch (error) {
      console.error("❌ Failed to create initial listing:", error);
      toast({
        title: "Error",
        description: "Failed to create listing. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleVehicleDataSubmit = async (formData: VehicleDataForm) => {
    console.log("Step1 handleVehicleDataSubmit:", formData);
    setIsCreatingListing(true);

    try {
      // Create the listing in the database if it doesn't exist yet
      let listingId = data.id;
      
      if (!listingId) {
        console.log("📝 No existing listing ID, creating new listing...");
        listingId = await createInitialListing(formData);
        
        if (!listingId) {
          // Error already handled in createInitialListing
          setIsCreatingListing(false);
          return;
        }
      } else {
        console.log("🔄 Updating existing listing:", listingId);
        // Update existing listing with new vehicle data
        const { error } = await supabase
          .from("listings")
          .update({
            brand: formData.brand,
            model: formData.model,
            year: Number(formData.year),
            mileage_km: Number(formData.km),
            fuel: formData.fuel,
            gearbox: formData.gearbox,
            body: formData.body,
            title: `${formData.brand} ${formData.model}`
          })
          .eq("id", listingId);

        if (error) {
          console.error("❌ Error updating listing:", error);
          toast({
            title: "Error",
            description: "Failed to update listing. Please try again.",
            variant: "destructive"
          });
          setIsCreatingListing(false);
          return;
        }
      }

      // Ensure km is properly converted to number and mapped to mileage
      const processedData = {
        ...formData,
        id: listingId, // ✅ CRITICAL: Store the listing ID in wizard state
        km: formData.km ? Number(formData.km) : undefined,
        mileage: formData.km ? Number(formData.km) : undefined
      };
      
      console.log("✅ Processed vehicle data with listing ID:", processedData);
      console.log("🔍 About to update wizard data with:", { id: listingId, ...processedData });
      
      updateData(processedData);
      
      // Verify that the ID was actually stored
      console.log("🔍 Current wizard data after update:", data);
      
      toast({
        title: "Success",
        description: "Vehicle data saved successfully!",
      });

      nextStep();

    } catch (error) {
      console.error("❌ Unexpected error in vehicle data submission:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingListing(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1989 }, 
    (_, i) => currentYear - i
  );
  
  const watchedKm = watch("km");

  useEffect(() => {
    // Format the displayed value
    const input = document.getElementById('km') as HTMLInputElement;
    if (input && document.activeElement !== input) {
        if (watchedKm) {
            input.value = new Intl.NumberFormat('de-CH').format(watchedKm);
        }
    }
  }, [watchedKm]);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-light text-neutral-900 mb-2 tracking-tight">
          Fahrzeugdaten
        </h2>
        <p className="text-neutral-600 font-light leading-relaxed">
          Grundlegende Informationen zu Ihrem Fahrzeug
        </p>
      </div>

      <form onSubmit={handleSubmit(handleVehicleDataSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Brand */}
          <div className="space-y-2">
            <Label htmlFor="brand" className="text-sm font-medium text-neutral-700">
              Marke *
            </Label>
            <Select
              value={watch("brand")}
              onValueChange={(value) => setValue("brand", value, { shouldValidate: true })}
            >
              <SelectTrigger className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm">
                <SelectValue placeholder="Marke auswählen" />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.brand && (
              <p className="text-sm text-red-500 font-light">{errors.brand.message}</p>
            )}
          </div>

          {/* Model */}
          <div className="space-y-2">
            <Label htmlFor="model" className="text-sm font-medium text-neutral-700">
              Modell *
            </Label>
            <Input
              id="model"
              {...register("model")}
              placeholder="z.B. A4, 320i, C-Klasse"
              className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm"
            />
            {errors.model && (
              <p className="text-sm text-red-500 font-light">{errors.model.message}</p>
            )}
          </div>

          {/* Year */}
          <div className="space-y-2">
            <Label htmlFor="year" className="text-sm font-medium text-neutral-700">
              Baujahr *
            </Label>
            <Select
              value={watch("year")?.toString()}
              onValueChange={(value) => setValue("year", parseInt(value), { shouldValidate: true })}
            >
              <SelectTrigger className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm">
                <SelectValue placeholder="Jahr auswählen" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.year && (
              <p className="text-sm text-red-500 font-light">{errors.year.message}</p>
            )}
          </div>

          {/* Kilometers */}
          <div className="space-y-2">
            <Label htmlFor="km" className="text-sm font-medium text-neutral-700">
              Kilometerstand *
            </Label>
            <div className="relative">
              <Input
                id="km"
                {...register("km")}
                type="text"
                inputMode="numeric"
                placeholder="z.B. 35'000"
                className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm pr-12"
                onFocus={(e) => {
                    if (e.target.value) {
                        e.target.value = e.target.value.replace(/[^0-9]/g, '');
                    }
                }}
                onBlur={(e) => {
                    trigger("km");
                    const value = e.target.value;
                    if (value) {
                        const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
                        if (!isNaN(num)) {
                            e.target.value = new Intl.NumberFormat('de-CH').format(num);
                        }
                    }
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500 font-light">
                km
              </span>
            </div>
            {errors.km && (
              <p className="text-sm text-red-500 font-light">{errors.km.message}</p>
            )}
          </div>

          {/* Body Type */}
          <div className="space-y-2">
            <Label htmlFor="body" className="text-sm font-medium text-neutral-700">
              Karosserie *
            </Label>
            <Select
              value={watch("body")}
              onValueChange={(value) => setValue("body", value as "Limousine" | "Kombi" | "SUV" | "Cabrio", { shouldValidate: true })}
            >
              <SelectTrigger className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm">
                <SelectValue placeholder="Karosserie auswählen" />
              </SelectTrigger>
              <SelectContent>
                {bodyTypes.map((body) => (
                  <SelectItem key={body} value={body}>
                    {body}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.body && (
              <p className="text-sm text-red-500 font-light">{errors.body.message}</p>
            )}
          </div>

          {/* Fuel Type */}
          <div className="space-y-2">
            <Label htmlFor="fuel" className="text-sm font-medium text-neutral-700">
              Antrieb *
            </Label>
            <Select
              value={watch("fuel")}
              onValueChange={(value) => setValue("fuel", value as "Benzin" | "Diesel" | "Hybrid" | "Elektro", { shouldValidate: true })}
            >
              <SelectTrigger className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm">
                <SelectValue placeholder="Antrieb auswählen" />
              </SelectTrigger>
              <SelectContent>
                {fuelTypes.map((fuel) => (
                  <SelectItem key={fuel} value={fuel}>
                    {fuel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.fuel && (
              <p className="text-sm text-red-500 font-light">{errors.fuel.message}</p>
            )}
          </div>
        </div>

        {/* Gearbox - Full Width */}
        <div className="space-y-2">
          <Label htmlFor="gearbox" className="text-sm font-medium text-neutral-700">
            Getriebe *
          </Label>
          <Select
            value={watch("gearbox")}
            onValueChange={(value) => setValue("gearbox", value as "Automatik" | "Manuell", { shouldValidate: true })}
          >
            <SelectTrigger className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm">
              <SelectValue placeholder="Getriebe auswählen" />
            </SelectTrigger>
            <SelectContent>
              {gearboxTypes.map((gearbox) => (
                <SelectItem key={gearbox} value={gearbox}>
                  {gearbox}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.gearbox && (
            <p className="text-sm text-red-500 font-light">{errors.gearbox.message}</p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-end pt-6">
          <Button
            type="submit"
            disabled={isCreatingListing}
            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingListing ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Erstelle Inserat...
              </>
            ) : (
              "Weiter zu Leasingdetails"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
