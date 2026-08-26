import { Separator } from 'buyauto';

export function Horizontal() {
  return (
    <div className="w-full max-w-sm">
      <div className="text-sm font-medium">Fahrzeugdaten</div>
      <div className="text-xs text-muted-foreground">BMW 320d Touring · 2022</div>
      <Separator className="my-4" />
      <div className="text-sm text-muted-foreground">42’000 km · Diesel · Automatik</div>
    </div>
  );
}

// Vertical needs an explicit height — it has no intrinsic size and renders
// nothing inside an auto-height row.
export function Vertical() {
  return (
    <div className="flex h-6 items-center gap-3 text-sm">
      <span>Zürich</span>
      <Separator orientation="vertical" />
      <span>42’000 km</span>
      <Separator orientation="vertical" />
      <span>Diesel</span>
    </div>
  );
}
