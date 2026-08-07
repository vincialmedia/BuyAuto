import { Checkbox, Input, Label, Switch } from 'buyauto';

// Label is a styled <label>; the point of it is the control it names, so every
// cell pairs it with one.
export function WithControls() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="l-brand">Marke</Label>
        <Input id="l-brand" defaultValue="BMW" />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="l-agb" checked /><Label htmlFor="l-agb">AGB akzeptieren</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="l-news" /><Label htmlFor="l-news">Newsletter abonnieren</Label>
      </div>
    </div>
  );
}

// The peer-disabled rule greys the label when its control is disabled.
export function Disabled() {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="l-off">Nicht bearbeitbar</Label>
      <Input id="l-off" disabled defaultValue="Nach Veröffentlichung gesperrt" className="max-w-sm" />
    </div>
  );
}
