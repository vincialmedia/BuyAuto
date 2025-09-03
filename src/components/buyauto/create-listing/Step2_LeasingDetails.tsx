
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWizard } from "./ListingWizard";
import { leasingDetailsSchema, type LeasingDetailsForm } from "@/lib/buyauto/schemas";
import { ChevronLeft } from "lucide-react";

const swissCantons = [
  { code: "AG", name: "Aargau" },
  { code: "AI", name: "Appenzell Innerrhoden" },
  { code: "AR", name: "Appenzell Ausserrhoden" },
  { code: "BE", name: "Bern" },
  { code: "BL", name: "Basel-Landschaft" },
  { code: "BS", name: "Basel-Stadt" },
  { code: "FR", name: "Fribourg" },
  { code: "GE", name: "Genève" },
  { code: "GL", name: "Glarus" },
  { code: "GR", name: "Graubünden" },
  { code: "JU", name: "Jura" },
  { code: "LU", name: "Luzern" },
  { code: "NE", name: "Neuchâtel" },
  { code: "NW", name: "Nidwalden" },
  { code: "OW", name: "Obwalden" },
  { code: "SG", name: "St. Gallen" },
  { code: "SH", name: "Schaffhausen" },
  { code: "SO", name: "Solothurn" },
  { code: "SZ", name: "Schwyz" },
  { code: "TG", name: "Thurgau" },
  { code: "TI", name: "Ticino" },
  { code: "UR", name: "Uri" },
  { code: "VD", name: "Vaud" },
  { code: "VS", name: "Valais" },
  { code: "ZG", name: "Zug" },
  { code: "ZH", name: "Zürich" },
];

export default function Step2_LeasingDetails() {
  const { data, updateData, nextStep, prevStep } = useWizard();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LeasingDetailsForm>({
    resolver: zodResolver(leasingDetailsSchema),
    defaultValues: {
      price_per_month_chf: data.price_per_month_chf || 0,
      remaining_months: data.remaining_months || 12,
      deposit_chf: data.deposit_chf || 0,
      location: data.location,
      canton_code: data.canton_code,
    },
  });

  const onSubmit = (formData: LeasingDetailsForm) => {
    updateData(formData);
    nextStep();
  };

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/[^\d]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, "'");
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

          {/* Canton */}
          <div className="space-y-2">
            <Label htmlFor="canton_code" className="text-sm font-medium text-neutral-700">
              Kanton *
            </Label>
            <Select
              value={watch("canton_code")}
              onValueChange={(value) => setValue("canton_code", value, { shouldValidate: true })}
            >
              <SelectTrigger className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm">
                <SelectValue placeholder="Kanton auswählen" />
              </SelectTrigger>
              <SelectContent>
                {swissCantons.map((canton) => (
                  <SelectItem key={canton.code} value={canton.code}>
                    {canton.name} ({canton.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.canton_code && (
              <p className="text-sm text-red-500 font-light">{errors.canton_code.message}</p>
            )}
          </div>
        </div>

        {/* Location - Full Width */}
        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm font-medium text-neutral-700">
            Standort *
          </Label>
          <Input
            id="location"
            {...register("location")}
            placeholder="z.B. Zürich, Basel, Genf"
            className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm"
          />
          {errors.location && (
            <p className="text-sm text-red-500 font-light">{errors.location.message}</p>
          )}
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
              <p className="text-neutral-500 mb-1 font-light">Kaution</p>
              <p className="text-xl font-semibold text-neutral-900">
                CHF {watch("deposit_chf") ? formatCurrency(watch("deposit_chf").toString()) : "0"}
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
            Weiter zu Bildern
          </Button>
        </div>
      </form>
    </div>
  );
}
