import { Label, Slider } from 'buyauto';

// `defaultValue` positions the thumb; without it the thumb sits at 0 and the
// filled range is invisible.
export function Budget() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm"><Label>Monatsbudget</Label>
          <span className="text-muted-foreground">CHF 500</span></div>
        <Slider defaultValue={[500]} min={0} max={2000} step={50} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm"><Label>Kilometerstand</Label>
          <span className="text-muted-foreground">bis 80’000 km</span></div>
        <Slider defaultValue={[80000]} min={0} max={200000} step={5000} />
      </div>
    </div>
  );
}

// Two thumbs — the range filter the search page uses.
export function Range() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-2">
      <div className="flex justify-between text-sm"><Label>Preisbereich</Label>
        <span className="text-muted-foreground">CHF 300 – 900</span></div>
      <Slider defaultValue={[300, 900]} min={0} max={2000} step={50} />
    </div>
  );
}
