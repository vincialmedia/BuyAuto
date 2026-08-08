import { Label, Textarea } from 'buyauto';

export function States() {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="t-desc">Fahrzeugbeschreibung</Label>
        <Textarea
          id="t-desc"
          rows={4}
          defaultValue={
            'Sehr gepflegter BMW 320d Touring aus erster Hand. Scheckheftgepflegt, ' +
            'Winterreifen auf Alufelgen inklusive. Nichtraucherfahrzeug, unfallfrei. ' +
            'Leasingvertrag läuft noch 23 Monate.'
          }
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="t-empty">Mit Platzhalter</Label>
        <Textarea id="t-empty" rows={3} placeholder="Beschreibe dein Fahrzeug in wenigen Sätzen…" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="t-off">Deaktiviert</Label>
        <Textarea id="t-off" rows={2} disabled defaultValue="Nach der Veröffentlichung nicht mehr bearbeitbar." />
      </div>
    </div>
  );
}
