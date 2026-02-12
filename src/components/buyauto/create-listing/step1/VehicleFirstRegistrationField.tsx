import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface VehicleFirstRegistrationFieldProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  error?: string;
}

export function VehicleFirstRegistrationField(props: VehicleFirstRegistrationFieldProps) {
  const { value, onChange, disabled = false, error } = props;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-neutral-700">Erstzulassung (optional)</Label>
      <Input
        type="month"
        lang="de"
        disabled={disabled}
        className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
      />
      {error ? <p className="text-sm text-red-500 font-light">{error}</p> : null}
    </div>
  );
}