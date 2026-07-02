import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormTrigger, UseFormWatch } from "react-hook-form";
import { useEffect, useMemo } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VehicleDescriptionField } from "@/components/buyauto/create-listing/step1/VehicleDescriptionField";
import { VehicleFirstRegistrationField } from "@/components/buyauto/create-listing/step1/VehicleFirstRegistrationField";
import { LocationAutocomplete } from "@/components/buyauto/create-listing/step1/LocationAutocomplete";
import { BODY_TYPES, FUEL_TYPES, GEARBOX_TYPES, DRIVETRAIN_TYPES, CANTON_CODES, CANTON_LABELS } from "@/lib/buyauto/listingContract";

export interface CanonicalOption {
  id: string;
  name: string;
}

export interface VehicleStepFormValues {
  vin: string;

  make_id: string;
  model_id: string;
  variant_id: string;

  year: number;
  km: number;

  fuel: string;
  gearbox: string;
  body: string;

  location: string;
  canton_code: string;
  power_hp: number | undefined;
  drivetrain: string;
  first_registration?: string | null;

  description?: string;
}

// Body/fuel/gearbox/drivetrain options come from the single field contract so
// the dropdown can never offer a value the DB CHECK will reject (the Coupe bug).
const bodyTypes = BODY_TYPES;
const fuelTypes = FUEL_TYPES;
const gearboxTypes = GEARBOX_TYPES;
const drivetrainTypes = DRIVETRAIN_TYPES;

export interface VehicleBasicsSectionProps {
  register: UseFormRegister<VehicleStepFormValues>;
  setValue: UseFormSetValue<VehicleStepFormValues>;
  trigger: UseFormTrigger<VehicleStepFormValues>;
  watch: UseFormWatch<VehicleStepFormValues>;
  errors: FieldErrors<VehicleStepFormValues>;

  makes: CanonicalOption[];
  models: CanonicalOption[];

  loadingMakes: boolean;
  loadingModels: boolean;

  disableAllFields?: boolean;
  locationRequired?: boolean;
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
    disableAllFields = false,
    locationRequired = true,
  } = props;

  const selectedMakeId = watch("make_id");
  const selectedModelId = watch("model_id");
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
    <div className="relative">
      {disableAllFields ? (
        <div className="absolute inset-0 z-10 flex items-start justify-center pt-8">
          <div className="rounded-2xl border border-neutral-200 bg-white/90 backdrop-blur px-4 py-3 shadow-sm text-sm text-neutral-700">
            Bitte zuerst die VIN eingeben und <span className="font-medium">„Daten laden“</span> klicken.
          </div>
        </div>
      ) : null}

      <div className={disableAllFields ? "opacity-50 pointer-events-none select-none" : ""}>
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">Marke *</Label>
              <Select
                value={selectedMakeId || ""}
                onValueChange={(value) => {
                  setValue("make_id", value, { shouldValidate: true, shouldDirty: true });
                  setValue("model_id", "", { shouldValidate: false, shouldDirty: true });
                  setValue("variant_id", "", { shouldValidate: false, shouldDirty: true });
                }}
                disabled={disableAllFields}
              >
                <SelectTrigger className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm">
                  <SelectValue placeholder={loadingMakes ? "Lädt..." : "Marke auswählen"} />
                </SelectTrigger>
                <SelectContent>
                  {(makes ?? []).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.make_id && <p className="text-sm text-red-500 font-light">{errors.make_id.message as string}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">Modell (Basis) *</Label>
              <Select
                value={selectedModelId || ""}
                onValueChange={(value) => {
                  setValue("model_id", value, { shouldValidate: true, shouldDirty: true });
                  setValue("variant_id", "", { shouldValidate: false, shouldDirty: true });
                }}
                disabled={disableAllFields || !selectedMakeId || loadingModels}
              >
                <SelectTrigger className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm">
                  <SelectValue placeholder={!selectedMakeId ? "Zuerst Marke wählen" : loadingModels ? "Lädt..." : "Modell auswählen"} />
                </SelectTrigger>
                <SelectContent>
                  {(models ?? []).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.model_id && <p className="text-sm text-red-500 font-light">{errors.model_id.message as string}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">
                Standort{locationRequired ? " *" : " (optional)"}
              </Label>
              <LocationAutocomplete
                name={register("location").name}
                inputRef={register("location").ref}
                value={String(watch("location") ?? "")}
                placeholder="z.B. Schlieren, ZH"
                disabled={disableAllFields}
                inputClassName="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm placeholder:text-neutral-400"
                onValueChange={(next) => setValue("location", next, { shouldValidate: true, shouldDirty: true })}
                onBlur={() => {
                  void trigger("location");
                }}
              />
              {errors.location && <p className="text-sm text-red-500 font-light">{errors.location.message as string}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">Kanton *</Label>
              <Select
                value={watch("canton_code") ?? ""}
                onValueChange={(value) => setValue("canton_code", value, { shouldValidate: true, shouldDirty: true })}
                disabled={disableAllFields}
              >
                <SelectTrigger className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm">
                  <SelectValue placeholder="Kanton auswählen" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {CANTON_CODES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {CANTON_LABELS[code]} ({code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-neutral-500 font-light">Damit Käufer in deiner Region dein Inserat finden.</p>
              {errors.canton_code && <p className="text-sm text-red-500 font-light">{errors.canton_code.message as string}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">Baujahr *</Label>
              <Select
                value={String(watch("year") ?? "")}
                onValueChange={(value) => setValue("year", parseInt(value, 10), { shouldValidate: true, shouldDirty: true })}
                disabled={disableAllFields}
              >
                <SelectTrigger className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm">
                  <SelectValue placeholder="Jahr auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
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
                  disabled={disableAllFields}
                  className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm pr-12"
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setValue("km", value ? parseInt(value, 10) : 0, { shouldValidate: true, shouldDirty: true });
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
              <Label className="text-sm font-medium text-neutral-700">Treibstoff *</Label>
              <Select
                value={watch("fuel")}
                onValueChange={(value) => setValue("fuel", value, { shouldValidate: true, shouldDirty: true })}
                disabled={disableAllFields}
              >
                <SelectTrigger className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm">
                  <SelectValue placeholder="Treibstoff auswählen" />
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

            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">Getriebe *</Label>
              <Select
                value={watch("gearbox")}
                onValueChange={(value) => setValue("gearbox", value, { shouldValidate: true, shouldDirty: true })}
                disabled={disableAllFields}
              >
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
              <Label className="text-sm font-medium text-neutral-700">Karosserie *</Label>
              <Select
                value={watch("body")}
                onValueChange={(value) => setValue("body", value, { shouldValidate: true, shouldDirty: true })}
                disabled={disableAllFields}
              >
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
              <Label className="text-sm font-medium text-neutral-700">Leistung (PS) *</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="z.B. 306"
                disabled={disableAllFields}
                className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm"
                value={watch("power_hp") == null ? "" : String(watch("power_hp"))}
                onChange={(e) => {
                  const num = e.target.value === "" ? undefined : Number(e.target.value);
                  setValue("power_hp", Number.isFinite(num as number) ? (num as number) : undefined, { shouldValidate: true, shouldDirty: true });
                }}
              />
              {errors.power_hp && <p className="text-sm text-red-500 font-light">{errors.power_hp.message as string}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-neutral-700">Antrieb (Drivetrain) *</Label>
              <Select
                value={watch("drivetrain") ?? ""}
                onValueChange={(value) => setValue("drivetrain", value, { shouldValidate: true, shouldDirty: true })}
                disabled={disableAllFields}
              >
                <SelectTrigger className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm">
                  <SelectValue placeholder="Antrieb auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {drivetrainTypes.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.drivetrain && <p className="text-sm text-red-500 font-light">{errors.drivetrain.message as string}</p>}
            </div>

            <div className="space-y-2">
              <VehicleFirstRegistrationField
                value={watch("first_registration")}
                disabled={disableAllFields}
                error={errors.first_registration?.message as string | undefined}
                onChange={(value) => setValue("first_registration", value, { shouldValidate: true, shouldDirty: true })}
              />
            </div>
          </div>

          <VehicleDescriptionField
            registration={register("description")}
            disabled={disableAllFields}
            error={errors.description?.message as string | undefined}
            descriptionLength={descriptionLength}
          />
        </div>
      </div>
    </div>
  );
}