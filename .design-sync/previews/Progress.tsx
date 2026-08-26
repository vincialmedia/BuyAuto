import { Progress } from 'buyauto';

// Progress is an 8px track — with no `value` it renders as an empty bar, which
// is what tripped the blank check. Fixed values, never animated: a capture of
// a moving bar is not reproducible.
export function Values() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      {[0, 25, 60, 100].map((v) => (
        <div key={v} className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Fortschritt</span>
            <span>{v}%</span>
          </div>
          <Progress value={v} />
        </div>
      ))}
    </div>
  );
}

// How the listing wizard uses it.
export function InWizard() {
  return (
    <div className="w-full max-w-md rounded-lg border p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-sm font-medium">Inserat erstellen</span>
        <span className="text-xs text-muted-foreground">Schritt 3 von 5</span>
      </div>
      <Progress value={60} />
      <p className="mt-3 text-xs text-muted-foreground">Noch 2 Schritte bis zur Vorschau.</p>
    </div>
  );
}
