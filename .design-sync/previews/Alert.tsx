import { Alert, AlertDescription, AlertTitle } from 'buyauto';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';

// Alert renders its icon via a `[&>svg]` selector on the root, so the icon is
// a direct child rather than nested in the title.
export function Variants() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <Alert>
        <Info className="size-4" />
        <AlertTitle>Vertrag wird geprüft</AlertTitle>
        <AlertDescription>
          Wir prüfen dein Inserat normalerweise innerhalb von 24 Stunden.
        </AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertTriangle className="size-4" />
        <AlertTitle>Zahlung fehlgeschlagen</AlertTitle>
        <AlertDescription>
          Deine Karte wurde abgelehnt. Bitte hinterlege eine andere Zahlungsmethode.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export function TitleOnly() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <Alert>
        <CheckCircle2 className="size-4" />
        <AlertTitle>Inserat erfolgreich veröffentlicht</AlertTitle>
      </Alert>
      <Alert>
        <AlertDescription>
          Ohne Titel und ohne Icon — nur die Beschreibung.
        </AlertDescription>
      </Alert>
    </div>
  );
}
