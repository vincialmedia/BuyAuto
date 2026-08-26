import { Label, RadioGroup, RadioGroupItem } from 'buyauto';

// RadioGroupItem throws nothing outside a RadioGroup but renders unmanaged, so
// every cell composes the full group — which is the only true rendering anyway.
export function DealType() {
  return (
    <RadioGroup defaultValue="takeover" className="gap-3">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="takeover" id="r1" /><Label htmlFor="r1">Leasingübernahme</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="purchase" id="r2" /><Label htmlFor="r2">Direktkauf</Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="both" id="r3" disabled /><Label htmlFor="r3">Beides (nicht verfügbar)</Label>
      </div>
    </RadioGroup>
  );
}

export function AsCards() {
  return (
    <RadioGroup defaultValue="30" className="grid w-full max-w-md gap-3 sm:grid-cols-3">
      {[['30', '30 Tage', 'CHF 0'], ['60', '60 Tage', 'CHF 49'], ['90', '90 Tage', 'CHF 79']].map(([v, t, p]) => (
        <Label key={v} htmlFor={`p-${v}`} className="flex cursor-pointer flex-col gap-1 rounded-lg border p-3 font-normal">
          <div className="flex items-center gap-2"><RadioGroupItem value={v} id={`p-${v}`} />
            <span className="text-sm font-medium">{t}</span></div>
          <span className="text-xs text-muted-foreground">{p}</span>
        </Label>
      ))}
    </RadioGroup>
  );
}
