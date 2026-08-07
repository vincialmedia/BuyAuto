import { Checkbox, Label } from 'buyauto';

// `checked` is set explicitly rather than left uncontrolled, so a screenshot
// shows both states instead of four identical empty boxes.
export function States() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2"><Checkbox id="c1" /><Label htmlFor="c1">Nur Garagen</Label></div>
      <div className="flex items-center gap-2"><Checkbox id="c2" checked /><Label htmlFor="c2">Nur Premium-Inserate</Label></div>
      <div className="flex items-center gap-2"><Checkbox id="c3" disabled /><Label htmlFor="c3">Deaktiviert</Label></div>
      <div className="flex items-center gap-2"><Checkbox id="c4" checked disabled /><Label htmlFor="c4">Deaktiviert, gewählt</Label></div>
    </div>
  );
}

export function FilterList() {
  return (
    <div className="w-full max-w-xs rounded-lg border p-4">
      <div className="mb-3 text-sm font-medium">Treibstoff</div>
      <div className="flex flex-col gap-2.5">
        {[['Benzin', false], ['Diesel', true], ['Hybrid', true], ['Elektro', false]].map(([l, c]) => (
          <div key={l as string} className="flex items-center gap-2">
            <Checkbox id={`f-${l}`} checked={c as boolean} />
            <Label htmlFor={`f-${l}`} className="font-normal">{l as string}</Label>
          </div>
        ))}
      </div>
    </div>
  );
}
