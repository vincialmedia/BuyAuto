import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface VehicleFirstRegistrationFieldProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  error?: string;
  /** When the field is wrapped by an external label, skip our own label/error. */
  hideLabel?: boolean;
}

export function VehicleFirstRegistrationField(props: VehicleFirstRegistrationFieldProps) {
  const { value, onChange, disabled = false, error, hideLabel = false } = props;

  const input = (
    <Input
      type="month"
      lang="de-CH"
      disabled={disabled}
      className="bg-white border border-neutral-200/60 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm rounded-xl"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
    />
  );

  if (hideLabel) return input;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-neutral-700">Erstzulassung (optional)</Label>
      {input}
      {error ? <p className="text-sm text-red-500 font-light">{error}</p> : null}
    </div>
  );
}
