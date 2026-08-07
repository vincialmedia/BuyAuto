import { Button, Input, Label, Popover, PopoverContent, PopoverTrigger } from 'buyauto';

// Open + non-modal so the panel mounts and the trigger stays visible beside it.
export function Open() {
  return (
    <div className="relative h-64">
      <Popover open modal={false}>
        <PopoverTrigger asChild><Button variant="outline">Filter anpassen</Button></PopoverTrigger>
        <PopoverContent align="start" sideOffset={6} className="w-72">
          <div className="flex flex-col gap-3">
            <div className="text-sm font-medium">Preisbereich</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5"><Label htmlFor="p-min">Von</Label>
                <Input id="p-min" defaultValue="300" /></div>
              <div className="flex flex-col gap-1.5"><Label htmlFor="p-max">Bis</Label>
                <Input id="p-max" defaultValue="900" /></div>
            </div>
            <Button size="sm">Anwenden</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
