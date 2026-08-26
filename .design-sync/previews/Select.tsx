import { Label, Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from 'buyauto';

// Radix renders SelectContent in a portal only while open, and an open select
// escapes the card. The closed trigger is what a static card can show — and it
// is what the search filters look like most of the time. `defaultValue` is set
// so the trigger shows a real value rather than only the placeholder.
export function Triggers() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Select defaultValue="bmw">
        <SelectTrigger><SelectValue placeholder="Marke wählen" /></SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Marke</SelectLabel>
            <SelectItem value="bmw">BMW</SelectItem>
            <SelectItem value="audi">Audi</SelectItem>
            <SelectItem value="vw">VW</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select>
        <SelectTrigger><SelectValue placeholder="Kanton wählen" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="zh">Zürich</SelectItem>
          <SelectItem value="be">Bern</SelectItem>
        </SelectContent>
      </Select>
      <Select disabled defaultValue="diesel">
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="diesel">Diesel</SelectItem></SelectContent>
      </Select>
    </div>
  );
}

export function InFilterRow() {
  return (
    <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-3">
      {[
        { id: 'f-brand', label: 'Marke', value: 'bmw', options: [['bmw','BMW'],['audi','Audi']] },
        { id: 'f-fuel', label: 'Treibstoff', value: 'diesel', options: [['diesel','Diesel'],['benzin','Benzin']] },
        { id: 'f-gear', label: 'Getriebe', value: 'auto', options: [['auto','Automatik'],['man','Manuell']] },
      ].map((f) => (
        <div key={f.id} className="flex flex-col gap-1.5">
          <Label htmlFor={f.id}>{f.label}</Label>
          <Select defaultValue={f.value}>
            <SelectTrigger id={f.id}><SelectValue /></SelectTrigger>
            <SelectContent>
              {f.options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
