import type { UseFormRegisterReturn } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface VehicleDescriptionFieldProps {
  registration: UseFormRegisterReturn;
  disabled?: boolean;
  error?: string;
  descriptionLength: number;
}

export function VehicleDescriptionField(props: VehicleDescriptionFieldProps) {
  const { registration, disabled = false, error, descriptionLength } = props;

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-neutral-700">Fahrzeugbeschreibung (optional)</Label>
      <Textarea
        {...registration}
        disabled={disabled}
        placeholder="Beschreibe dein Fahrzeug: Besonderheiten, Ausstattung, Zustand, etc. (Max. 2000 Zeichen)"
        className="bg-white border border-neutral-200/40 hover:border-neutral-300 focus:border-red-500 transition-colors shadow-sm min-h-[120px] resize-y"
        rows={5}
      />
      <div className="flex justify-between items-center">
        {error ? <p className="text-sm text-red-500 font-light">{error}</p> : null}
        <p className="text-xs text-neutral-500 ml-auto">{descriptionLength}/2000 Zeichen</p>
      </div>
    </div>
  );
}