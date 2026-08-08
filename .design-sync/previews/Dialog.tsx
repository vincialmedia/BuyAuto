import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Input, Label } from 'buyauto';

// DialogContent is `fixed` and centred with translate-x/y-[-50%]. Inside a
// preview cell that pushes the panel half its own height above the top edge
// and the title gets clipped, so the centring is neutralised here and the
// panel renders in normal flow.
const PANEL = 'relative left-auto top-auto translate-x-0 translate-y-0';

// `open` is forced and `modal={false}` set: Radix mounts DialogContent in a
// portal only while open, and modal mode locks scroll and adds an inert
// overlay that interferes with capture. The trigger is omitted because the
// open dialog IS the thing worth previewing.
export function Confirm() {
  return (
    <Dialog open modal={false}>
      <DialogContent className={PANEL}>
        <DialogHeader>
          <DialogTitle>Inserat löschen?</DialogTitle>
          <DialogDescription>
            Diese Aktion kann nicht rückgängig gemacht werden. Das Inserat wird dauerhaft entfernt.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Abbrechen</Button>
          <Button variant="destructive">Endgültig löschen</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function WithForm() {
  return (
    <Dialog open modal={false}>
      <DialogContent className={PANEL}>
        <DialogHeader>
          <DialogTitle>Profil bearbeiten</DialogTitle>
          <DialogDescription>Änderungen werden sofort übernommen.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5"><Label htmlFor="d-name">Name</Label>
            <Input id="d-name" defaultValue="Vincent Hänggi" /></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="d-mail">E-Mail</Label>
            <Input id="d-mail" defaultValue="vincent@buyauto.ch" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline">Abbrechen</Button><Button>Speichern</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
