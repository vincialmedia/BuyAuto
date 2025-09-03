
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWizard } from "./ListingWizard";
import { vehicleDataSchema, type VehicleDataForm } from "@/lib/buyauto/schemas";

const brands = [
  "Audi", "BMW", "Mercedes-Benz", "Volkswagen", "Toyota", "Honda", "Ford", 
  "Opel", "Peugeot", "Renault", "Citroën", "Volvo", "Skoda", "Hyundai", 
  "Nissan", "Mazda", "Subaru", "Lexus", "Mini", "Seat", "Fiat"
];

const bodyTypes = [
  "Limousine", "Kombi", "SUV", "Coupé", "Cabriolet", "Kleinwagen", 
  "Van", "Pick-up", "Sportwagen", "Stadtgeländewagen"
];

const fuelTypes = [
  "Benzin", "Diesel", "Elektro", "Hybrid (Benzin)", "Hybrid (Diesel)", 
  "Plug-in-Hybrid", "Erdgas (CNG)", "Autogas (LPG)"
];

const gearboxTypes = [
  "Manuell", "Automatik", "Halbautomatik", "Stufenlos (CVT)"
];

export default function Step1_VehicleData() {
  const { data, updateData, nextStep } = useWizard();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<VehicleDataForm>({
    resolver: zodResolver(vehicleDataSchema),
    defaultValues: {
      brand: data.brand,
      model: data.model,
      year: data.year || new Date().getFullYear(),
      km: data.km || "0",
      body: data.body,
      fuel: data.fuel,
      gearbox: data.gearbox,
    },
  });

  const onSubmit = (formData: VehicleDataForm) => {
    updateData(formData);
    nextStep();
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1989 }, 
    (_, i) => currentYear - i
  );

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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                type="number"
                {...register("km")}
                placeholder="z.B. 35000"
                className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm pr-12"
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
              onValueChange={(value) => setValue("body", value, { shouldValidate: true })}
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
              onValueChange={(value) => setValue("fuel", value, { shouldValidate: true })}
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
            onValueChange={(value) => setValue("gearbox", value, { shouldValidate: true })}
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
            className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
          >
            Weiter zu Leasingdetails
          </Button>
        </div>
      </form>
    </div>
  );
}