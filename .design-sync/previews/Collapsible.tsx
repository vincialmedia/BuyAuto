import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'buyauto';
import { ChevronsUpDown } from 'lucide-react';

// `defaultOpen` is required for the content to be in the capture — a closed
// Collapsible renders only its trigger.
export function Open() {
  return (
    <Collapsible defaultOpen className="w-full max-w-sm rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Weitere Fahrzeugdaten</span>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon"><ChevronsUpDown /></Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
        <div>Antrieb: Hinterrad</div><div>Leistung: 190 PS</div>
        <div>Erstzulassung: 03/2022</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function Closed() {
  return (
    <Collapsible className="w-full max-w-sm rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Weitere Fahrzeugdaten</span>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon"><ChevronsUpDown /></Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="mt-3 text-sm text-muted-foreground">
        Versteckt, solange zugeklappt.
      </CollapsibleContent>
    </Collapsible>
  );
}
