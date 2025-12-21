import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWizard } from "./ListingWizard";
import { vehicleDataSchema, type VehicleDataForm } from "@/lib/buyauto/schemas";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { createOrUpdateListing } from "@/services/createListingService";

const brands = [
  "Audi", "BMW", "Mercedes-Benz", "Volkswagen", "Toyota", "Honda", "Ford", 
  "Opel", "Peugeot", "Renault", "Citroën", "Volvo", "Skoda", "Hyundai", 
  "Nissan", "Mazda", "Subaru", "Lexus", "Mini", "Seat", "Fiat"
];

const bodyTypes = [
  "Limousine", "Kombi", "SUV", "Cabrio"
];

const fuelTypes = [
  "Benzin", "Diesel", "Hybrid", "Elektro"
];

const gearboxTypes = [
  "Automatik", "Manuell"
];

export default function Step1_VehicleData() {
  const { data, updateData, nextStep } = useWizard();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
      km: data.km || data.mileage || 0, // ✅ Fixed: Use data.km or data.mileage instead of data.mileage_km
      body: (data.body as "Limousine" | "Kombi" | "SUV" | "Cabrio") || "",
      fuel: (data.fuel as "Benzin" | "Diesel" | "Hybrid" | "Elektro") || "",
      gearbox: (data.gearbox as "Automatik" | "Manuell") || "",
      description: data.description || "",
    },
    mode: "onBlur"
  });

  const handleVehicleDataSubmit = async (formData: VehicleDataForm) => {
    if (!user) {
      toast({
        title: "Nicht angemeldet",
        description: "Sie müssen angemeldet sein, um ein Inserat zu erstellen.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Step1 handleVehicleDataSubmit:', formData);
      
      // Clean the KM value - remove all non-numeric characters (like apostrophes)
      const cleanKm = formData.km.toString().replace(/[^0-9]/g, '');
      const parsedKm = parseInt(cleanKm, 10);

      // ✅ Generate proper title from vehicle data
      const generatedTitle = `${formData.brand} ${formData.model} ${formData.year}`;

      const validatedData = {
        brand: formData.brand,
        model: formData.model,
        year: parseInt(formData.year.toString()),
        mileage_km: parsedKm,
        fuel: formData.fuel as "Benzin" | "Diesel" | "Hybrid" | "Elektro",
        gearbox: formData.gearbox as "Automatik" | "Manuell",
        body: formData.body as "Limousine" | "Kombi" | "SUV" | "Cabrio",
        description: formData.description || undefined,
        title: generatedTitle, // ✅ Add generated title
      };

      const result = await createOrUpdateListing(validatedData, user);
      
      console.log("✅ Step1: Listing created/updated successfully:", result);
      
      updateData({ 
        ...validatedData,
        km: parsedKm, // Explicitly save km to match form field name
        id: result.id
      });

      console.log("✅ Step1: Wizard data updated with ID:", result.id);

      toast({
        title: "Fahrzeugdaten gespeichert",
        description: "Ihre Fahrzeugdaten wurden erfolgreich gespeichert.",
      });

      nextStep();
    } catch (error) {
      console.error("Error submitting vehicle data:", error);
      toast({
        title: "Fehler",
        description: "Fehler beim Speichern der Fahrzeugdaten. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1989 }, 
    (_, i) => currentYear - i
  );
  
  const watchedKm = watch("km");
  const descriptionLength = watch("description")?.length || 0;

  // Initial formatting effect only
  useEffect(() => {
    const input = document.getElementById('km') as HTMLInputElement;
    if (input && watchedKm) {
        input.value = new Intl.NumberFormat('de-CH').format(watchedKm);
    }
  }, []); // Only run once on mount

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
                placeholder="z.B. 35'000"
                className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm pr-12"
                onChange={(e) => {
                  // Keep only numbers
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setValue("km", value ? parseInt(value) : 0, { shouldValidate: true });
                  // Force update display value manually to allow typing
                  e.target.value = value; 
                }}
                onBlur={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  if (value) {
                    const num = parseInt(value, 10);
                    e.target.value = new Intl.NumberFormat('de-CH').format(num);
                  }
                  // Trigger validation
                  trigger("km");
                }}
                onFocus={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  e.target.value = value;
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

        {/* Description - Full Width - Added this section */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-neutral-700">
            Fahrzeugbeschreibung (optional)
          </Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Beschreiben Sie Ihr Fahrzeug: Besonderheiten, Ausstattung, Zustand, etc. (Max. 2000 Zeichen)"
            className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm min-h-[120px] resize-y"
            rows={5}
          />
          <div className="flex justify-between items-center">
            {errors.description && (
              <p className="text-sm text-red-500 font-light">{errors.description.message}</p>
            )}
            <p className="text-xs text-neutral-500 ml-auto">
              {descriptionLength}/2000 Zeichen
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-end pt-6">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50"
          >
            {isSubmitting ? 'Wird gespeichert...' : 'Weiter zu Leasingdetails'}
          </Button>
        </div>
      </form>
    </div>
  );
}
