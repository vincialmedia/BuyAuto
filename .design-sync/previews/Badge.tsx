import { Badge } from 'buyauto';

export function Variants() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge>Premium</Badge>
      <Badge variant="secondary">Neu</Badge>
      <Badge variant="outline">Garage</Badge>
      <Badge variant="destructive">Abgelaufen</Badge>
    </div>
  );
}

// How badges actually appear on a listing: stacked over the photo and inline
// beside the title.
export function OnListing() {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-lg border">
      <div className="relative h-32 bg-gradient-to-br from-zinc-700 to-zinc-900">
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge>Premium</Badge>
          <Badge variant="secondary">Leasingübernahme</Badge>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 p-4">
        <span className="text-sm font-medium">Audi Q5 40 TDI quattro</span>
        <Badge variant="outline">2023</Badge>
      </div>
    </div>
  );
}
