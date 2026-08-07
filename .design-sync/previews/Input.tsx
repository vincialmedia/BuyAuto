import { Input, Label } from 'buyauto';

// A bare <Input> with no value renders as an empty outline, which is why the
// unauthored card was flagged blank. Every cell here carries real content.

export function States() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Input placeholder="Marke oder Modell suchen" />
      <Input defaultValue="BMW 320d Touring" />
      <Input disabled defaultValue="Nicht bearbeitbar" />
      <Input type="number" defaultValue={42000} />
    </div>
  );
}

export function WithLabels() {
  return (
    <div className="grid w-full max-w-md gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="p-brand">Marke</Label>
        <Input id="p-brand" defaultValue="BMW" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="p-model">Modell</Label>
        <Input id="p-model" defaultValue="320d Touring" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="p-km">Kilometerstand</Label>
        <Input id="p-km" type="number" defaultValue={42000} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="p-rate">Monatsrate (CHF)</Label>
        <Input id="p-rate" type="number" defaultValue={489} />
      </div>
    </div>
  );
}

// aria-invalid is the app's error affordance; the message below is the
// surrounding form's, not the Input's own.
export function Invalid() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-1.5">
      <Label htmlFor="p-mail">E-Mail</Label>
      <Input id="p-mail" defaultValue="nicht-eine-email" aria-invalid className="border-destructive" />
      <span className="text-xs text-destructive">Bitte gib eine gültige E-Mail-Adresse ein.</span>
    </div>
  );
}
