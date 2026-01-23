import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormTrigger, UseFormWatch } from "react-hook-form";
import { useEffect, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VehicleStepFormValues {
  brand: string;
  model: string;
  year: number;
  km: number;
  gearbox: string;
  body: string;
  fuel: string;
  description?: string;
}

const bodyTypes = ["Limousine", "Kombi", "SUV", "Cabrio"];
const fuelTypes = ["Benzin", "Diesel", "Hybrid", "Elektro"];
const gearboxTypes = ["Automatik", "Manuell"];

export interface VehicleBasicsSectionProps {
  register: UseFormRegister<VehicleStepFormValues>;
  setValue: UseFormSetValue<VehicleStepFormValues>;
  trigger: UseFormTrigger<VehicleStepFormValues>;
  watch: UseFormWatch<VehicleStepFormValues>;
  errors: FieldErrors<VehicleStepFormValues>;

  makes: string[];
  models: string[];
  loadingMakes: boolean;
  loadingModels: boolean;

  makeOpen: boolean;
  setMakeOpen: (open: boolean) => void;
  modelOpen: boolean;
  setModelOpen: (open: boolean) => void;

  makeSearch: string;
  setMakeSearch: (val: string) => void;
  modelSearch: string;
  setModelSearch: (val: string) => void;
}

export function VehicleBasicsSection(props: VehicleBasicsSectionProps) {
  const {
    register,
    setValue,
    trigger,
    watch,
    errors,
    makes,
    models,
    loadingMakes,
    loadingModels,
    makeOpen,
    setMakeOpen,
    modelOpen,
    setModelOpen,
    makeSearch,
    setMakeSearch,
    modelSearch,
    setModelSearch,
  } = props;

  const selectedMake = watch("brand");
  const selectedModel = watch("model");
  const descriptionLength = (watch("description") ?? "").length;

  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i), [currentYear]);

  useEffect(() => {
    const kmValue = watch("km");
    const input = document.getElementById("km") as HTMLInputElement | null;
    if (!input) return;
    if (typeof kmValue !== "number") return;

    input.value = new Intl.NumberFormat("de-CH").format(kmValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="brand" className="text-sm font-medium text-neutral-700">
            Marke *
          </Label>
          <Popover open={makeOpen} onOpenChange={setMakeOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={makeOpen}
                className="w-full justify-between bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm"
                disabled={loadingMakes}
              >
                {selectedMake || (loadingMakes ? "Lädt..." : "Marke auswählen")}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Marke suchen..." value={makeSearch} onValueChange={setMakeSearch} />
                <CommandList>
                  <CommandEmpty>Keine Marke gefunden.</CommandEmpty>
                  <CommandGroup>
                    {makes.map((make) => (
                      <CommandItem
                        key={make}
                        value={make}
                        onSelect={(currentValue) => {
                          setValue("brand", currentValue, { shouldValidate: true });
                          setValue("model", "", { shouldValidate: false });
                          setMakeOpen(false);
                          setMakeSearch("");
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", selectedMake === make ? "opacity-100" : "opacity-0")} />
                        {make}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {errors.brand && <p className="text-sm text-red-500 font-light">{errors.brand.message as string}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="model" className="text-sm font-medium text-neutral-700">
            Modell *
          </Label>
          <Popover open={modelOpen} onOpenChange={setModelOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={modelOpen}
                className="w-full justify-between bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm"
                disabled={!selectedMake || loadingModels}
              >
                {selectedModel || (loadingModels ? "Lädt..." : !selectedMake ? "Zuerst Marke wählen" : "Modell auswählen")}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command>
                <CommandInput placeholder="Modell suchen..." value={modelSearch} onValueChange={setModelSearch} />
                <CommandList>
                  <CommandEmpty>Kein Modell gefunden.</CommandEmpty>
                  <CommandGroup>
                    {models.map((model) => (
                      <CommandItem
                        key={model}
                        value={model}
                        onSelect={(currentValue) => {
                          setValue("model", currentValue, { shouldValidate: true });
                          setModelOpen(false);
                          setModelSearch("");
                        }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", selectedModel === model ? "opacity-100" : "opacity-0")} />
                        {model}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {errors.model && <p className="text-sm text-red-500 font-light">{errors.model.message as string}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="year" className="text-sm font-medium text-neutral-700">
            Baujahr *
          </Label>
          <Select value={watch("year")?.toString()} onValueChange={(value) => setValue("year", parseInt(value, 10), { shouldValidate: true })}>
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
          {errors.year && <p className="text-sm text-red-500 font-light">{errors.year.message as string}</p>}
        </div>

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
                const value = e.target.value.replace(/[^0-9]/g, "");
                setValue("km", value ? parseInt(value, 10) : 0, { shouldValidate: true });
                e.target.value = value;
              }}
              onBlur={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, "");
                if (value) {
                  const num = parseInt(value, 10);
                  e.target.value = new Intl.NumberFormat("de-CH").format(num);
                }
                trigger("km");
              }}
              onFocus={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, "");
                e.target.value = value;
              }}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500 font-light">km</span>
          </div>
          {errors.km && <p className="text-sm text-red-500 font-light">{errors.km.message as string}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="gearbox" className="text-sm font-medium text-neutral-700">
            Getriebe *
          </Label>
          <Select value={watch("gearbox")} onValueChange={(value) => setValue("gearbox", value, { shouldValidate: true })}>
            <SelectTrigger className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm">
              <SelectValue placeholder="Getriebe auswählen" />
            </SelectTrigger>
            <SelectContent>
              {gearboxTypes.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.gearbox && <p className="text-sm text-red-500 font-light">{errors.gearbox.message as string}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="body" className="text-sm font-medium text-neutral-700">
            Karosserie *
          </Label>
          <Select value={watch("body")} onValueChange={(value) => setValue("body", value, { shouldValidate: true })}>
            <SelectTrigger className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm">
              <SelectValue placeholder="Karosserie auswählen" />
            </SelectTrigger>
            <SelectContent>
              {bodyTypes.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.body && <p className="text-sm text-red-500 font-light">{errors.body.message as string}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fuel" className="text-sm font-medium text-neutral-700">
            Antrieb *
          </Label>
          <Select value={watch("fuel")} onValueChange={(value) => setValue("fuel", value, { shouldValidate: true })}>
            <SelectTrigger className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm">
              <SelectValue placeholder="Antrieb auswählen" />
            </SelectTrigger>
            <SelectContent>
              {fuelTypes.map((f) => (
                <SelectItem key={f} value={f}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.fuel && <p className="text-sm text-red-500 font-light">{errors.fuel.message as string}</p>}
        </div>
      </div>

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
          {errors.description && <p className="text-sm text-red-500 font-light">{errors.description.message as string}</p>}
          <p className="text-xs text-neutral-500 ml-auto">{descriptionLength}/2000 Zeichen</p>
        </div>
      </div>
    </div>
  );
}