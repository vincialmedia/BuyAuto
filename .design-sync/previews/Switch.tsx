import { Label, Switch } from 'buyauto';

export function States() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2"><Switch id="s1" /><Label htmlFor="s1">Aus</Label></div>
      <div className="flex items-center gap-2"><Switch id="s2" checked /><Label htmlFor="s2">Ein</Label></div>
      <div className="flex items-center gap-2"><Switch id="s3" disabled /><Label htmlFor="s3">Deaktiviert</Label></div>
      <div className="flex items-center gap-2"><Switch id="s4" checked disabled /><Label htmlFor="s4">Deaktiviert, ein</Label></div>
    </div>
  );
}

// The settings-row pattern: label and description left, switch right.
export function SettingsRows() {
  return (
    <div className="w-full max-w-md divide-y rounded-lg border">
      {[
        ['E-Mail bei neuen Anfragen', 'Sofort benachrichtigt werden', true],
        ['Newsletter', 'Neue Leasingübernahmen monatlich', false],
        ['Profil öffentlich', 'Für andere Nutzer sichtbar', true],
      ].map(([t, d, on]) => (
        <div key={t as string} className="flex items-center justify-between gap-4 p-4">
          <div><div className="text-sm font-medium">{t as string}</div>
            <div className="text-xs text-muted-foreground">{d as string}</div></div>
          <Switch checked={on as boolean} />
        </div>
      ))}
    </div>
  );
}
