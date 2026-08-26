import { Button, Input, Label, Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from 'buyauto';

// Open + non-modal. A Sheet slides in from a viewport edge, so it is captured
// pinned to the edge of the card rather than as a free-standing panel — that
// is genuinely how it renders.
export function FilterPanel() {
  return (
    <Sheet open modal={false}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Filter</SheetTitle>
          <SheetDescription>Grenze die Suche weiter ein.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-1.5"><Label htmlFor="sh-brand">Marke</Label>
            <Input id="sh-brand" defaultValue="BMW" /></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="sh-max">Max. Rate (CHF)</Label>
            <Input id="sh-max" defaultValue="900" /></div>
        </div>
        <SheetFooter><Button>Anwenden</Button></SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
