import { AspectRatio } from 'buyauto';

// AspectRatio only constrains its child's shape — with no child it paints
// nothing, which is why the unauthored card was flagged as rendering nothing.
// Filled with visible blocks so the ratios themselves are the subject.
export function Ratios() {
  return (
    <div className="grid w-full max-w-2xl grid-cols-3 gap-4">
      {[
        { ratio: 16 / 9, label: '16 / 9' },
        { ratio: 4 / 3, label: '4 / 3' },
        { ratio: 1, label: '1 / 1' },
      ].map((r) => (
        <div key={r.label}>
          <AspectRatio ratio={r.ratio}>
            <div className="flex size-full items-center justify-center rounded-md bg-gradient-to-br from-zinc-700 to-zinc-900 text-sm font-medium text-white">
              {r.label}
            </div>
          </AspectRatio>
          <div className="mt-1.5 text-xs text-muted-foreground">{r.label}</div>
        </div>
      ))}
    </div>
  );
}

// What it is actually for here: keeping every listing photo the same shape in
// a results grid regardless of the source image.
export function ListingPhotoSlot() {
  return (
    <div className="w-full max-w-xs overflow-hidden rounded-lg border">
      <AspectRatio ratio={16 / 9}>
        <div className="flex size-full items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-900 text-xs text-white/70">
          Fahrzeugbild 16:9
        </div>
      </AspectRatio>
      <div className="p-3">
        <div className="text-sm font-medium">BMW 320d Touring</div>
        <div className="text-xs text-muted-foreground">ab CHF 489/Mt.</div>
      </div>
    </div>
  );
}
