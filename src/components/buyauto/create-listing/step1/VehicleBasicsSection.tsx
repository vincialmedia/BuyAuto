import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormTrigger, UseFormWatch } from "react-hook-form";
import { useEffect, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Car,
  CarFront,
  Calendar,
  CalendarClock,
  Gauge,
  Fuel,
  Cog,
  Zap,
  Route,
  MapPin,
  Check,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VehicleDescriptionField } from "@/components/buyauto/create-listing/step1/VehicleDescriptionField";
import { VehicleFirstRegistrationField } from "@/components/buyauto/create-listing/step1/VehicleFirstRegistrationField";
import { LocationAutocomplete, type LocationSuggestion } from "@/components/buyauto/create-listing/step1/LocationAutocomplete";
import {
  BODY_TYPES,
  FUEL_TYPES,
  GEARBOX_TYPES,
  DRIVETRAIN_TYPES,
  CANTON_LABELS,
  isCantonCode,
  type CantonCode,
} from "@/lib/buyauto/listingContract";

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

const selectTriggerCls =
  "bg-white border border-neutral-200/60 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm rounded-xl";

/** One labelled field: icon + label (+ required marker), the control, hint, error. */
function Field({
  icon: Icon,
  label,
  required,
  hint,
  error,
  children,
  className,
}: {
  icon: LucideIcon;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="flex items-center gap-1.5 text-sm font-medium text-neutral-700">
        <Icon className="h-3.5 w-3.5 text-neutral-400 shrink-0" aria-hidden />
        <span>{label}</span>
        {required ? <span className="text-red-500">*</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-xs text-neutral-500 font-light">{hint}</p> : null}
      {error ? <p className="text-sm text-red-500 font-light">{error}</p> : null}
    </div>
  );
}

/** A titled group of related fields, so Step 1 reads as a few tidy sections
 *  instead of one long wall of inputs. */
function Section({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <h3 className="text-base font-semibold tracking-tight text-neutral-900">{title}</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{children}</div>
    </section>
  );
}

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

  const cantonCode = watch("canton_code");
  const cantonLabel = cantonCode && isCantonCode(cantonCode) ? CANTON_LABELS[cantonCode as CantonCode] : null;

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

  const handleLocationSelect = (s: LocationSuggestion) => {
    setValue("location", s.value, { shouldValidate: true, shouldDirty: true });
    if (s.canton && isCantonCode(s.canton)) {
      setValue("canton_code", s.canton, { shouldValidate: true, shouldDirty: true });
    }
  };

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
        <div className="space-y-9">
          {/* ── Fahrzeug ─────────────────────────────────────────────── */}
          <Section icon={Car} title="Fahrzeug">
            <Field icon={Car} label="Marke" required error={errors.make_id?.message as string | undefined}>
              <Select
                value={selectedMakeId || ""}
                onValueChange={(value) => {
                  setValue("make_id", value, { shouldValidate: true, shouldDirty: true });
                  setValue("model_id", "", { shouldValidate: false, shouldDirty: true });
                  setValue("variant_id", "", { shouldValidate: false, shouldDirty: true });
                }}
                disabled={disableAllFields}
              >
                <SelectTrigger className={selectTriggerCls}>
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
            </Field>

            <Field icon={CarFront} label="Modell" required error={errors.model_id?.message as string | undefined}>
              <Select
                value={selectedModelId || ""}
                onValueChange={(value) => {
                  setValue("model_id", value, { shouldValidate: true, shouldDirty: true });
                  setValue("variant_id", "", { shouldValidate: false, shouldDirty: true });
                }}
                disabled={disableAllFields || !selectedMakeId || loadingModels}
              >
                <SelectTrigger className={selectTriggerCls}>
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
            </Field>

            <Field icon={Calendar} label="Baujahr" required error={errors.year?.message as string | undefined}>
              <Select
                value={String(watch("year") ?? "")}
                onValueChange={(value) => setValue("year", parseInt(value, 10), { shouldValidate: true, shouldDirty: true })}
                disabled={disableAllFields}
              >
                <SelectTrigger className={selectTriggerCls}>
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
            </Field>

            <Field icon={Gauge} label="Kilometerstand" required error={errors.km?.message as string | undefined}>
              <div className="relative">
                <Input
                  id="km"
                  {...register("km")}
                  type="text"
                  placeholder="z.B. 35'000"
                  disabled={disableAllFields}
                  className={`${selectTriggerCls} pr-12`}
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
            </Field>
          </Section>

          {/* ── Motor & Technik ──────────────────────────────────────── */}
          <Section icon={Cog} title="Motor & Technik">
            <Field icon={Fuel} label="Treibstoff" required error={errors.fuel?.message as string | undefined}>
              <Select
                value={watch("fuel")}
                onValueChange={(value) => setValue("fuel", value, { shouldValidate: true, shouldDirty: true })}
                disabled={disableAllFields}
              >
                <SelectTrigger className={selectTriggerCls}>
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
            </Field>

            <Field icon={Cog} label="Getriebe" required error={errors.gearbox?.message as string | undefined}>
              <Select
                value={watch("gearbox")}
                onValueChange={(value) => setValue("gearbox", value, { shouldValidate: true, shouldDirty: true })}
                disabled={disableAllFields}
              >
                <SelectTrigger className={selectTriggerCls}>
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
            </Field>

            <Field icon={Car} label="Karosserie" required error={errors.body?.message as string | undefined}>
              <Select
                value={watch("body")}
                onValueChange={(value) => setValue("body", value, { shouldValidate: true, shouldDirty: true })}
                disabled={disableAllFields}
              >
                <SelectTrigger className={selectTriggerCls}>
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
            </Field>

            <Field icon={Zap} label="Leistung (PS)" required error={errors.power_hp?.message as string | undefined}>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="z.B. 306"
                disabled={disableAllFields}
                className={selectTriggerCls}
                value={watch("power_hp") == null ? "" : String(watch("power_hp"))}
                onChange={(e) => {
                  const num = e.target.value === "" ? undefined : Number(e.target.value);
                  setValue("power_hp", Number.isFinite(num as number) ? (num as number) : undefined, { shouldValidate: true, shouldDirty: true });
                }}
              />
            </Field>

            <Field icon={Route} label="Antrieb" required error={errors.drivetrain?.message as string | undefined}>
              <Select
                value={watch("drivetrain") ?? ""}
                onValueChange={(value) => setValue("drivetrain", value, { shouldValidate: true, shouldDirty: true })}
                disabled={disableAllFields}
              >
                <SelectTrigger className={selectTriggerCls}>
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
            </Field>

            <Field icon={CalendarClock} label="Erstzulassung" error={errors.first_registration?.message as string | undefined}>
              <VehicleFirstRegistrationField
                value={watch("first_registration")}
                disabled={disableAllFields}
                error={undefined}
                onChange={(value) => setValue("first_registration", value, { shouldValidate: true, shouldDirty: true })}
                hideLabel
              />
            </Field>
          </Section>

          {/* ── Standort ─────────────────────────────────────────────── */}
          <Section icon={MapPin} title="Standort">
            <Field
              icon={MapPin}
              label="Standort"
              required={locationRequired}
              hint="Ort eingeben und aus der Liste wählen – der Kanton wird automatisch erkannt."
              error={
                (errors.location?.message as string | undefined) ??
                (errors.canton_code?.message as string | undefined)
              }
              className="md:col-span-2"
            >
              <LocationAutocomplete
                name={register("location").name}
                inputRef={register("location").ref}
                value={String(watch("location") ?? "")}
                placeholder="z.B. Schlieren"
                disabled={disableAllFields}
                inputClassName={`${selectTriggerCls} placeholder:text-neutral-400`}
                onValueChange={(next) => setValue("location", next, { shouldValidate: true, shouldDirty: true })}
                onSelect={handleLocationSelect}
                onBlur={() => {
                  void trigger("location");
                }}
              />
              {cantonLabel ? (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  Kanton erkannt: {cantonLabel} ({cantonCode})
                </div>
              ) : null}
            </Field>
          </Section>

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
