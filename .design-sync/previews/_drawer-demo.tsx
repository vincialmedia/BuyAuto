// Shared composition for DrawerHeader / DrawerFooter.
//
// Underscore-prefixed so it matches no component name and never becomes a card.
// It must live in a helper module rather than being imported from a sibling
// <Name>.tsx preview: each preview file is compiled as its own entry, and
// importing one preview from another yields an empty module at capture time
// (the card renders blank with no error). Helper modules like this one are the
// only shared-code pattern that works.
import { Button, DrawerFooter, DrawerHeader } from 'buyauto';

// The real Drawer (vaul) animates in from the viewport edge and cannot be
// opened by a static capture, and DrawerTitle / DrawerDescription are vaul
// primitives that throw outside the Drawer root context — using them here
// produced a blank card. DrawerHeader and DrawerFooter are plain divs, so they
// are the real components; the heading and body text carry the same classes
// DrawerTitle/DrawerDescription apply, and the rounded panel with the drag
// handle is preview scaffolding shaped like the drawer these slots live in.
export function DrawerPanel() {
  return (
    <div className="w-full max-w-sm overflow-hidden rounded-t-[10px] border bg-background">
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      <DrawerHeader>
        <h2 className="text-lg font-semibold leading-none tracking-tight">Inserat löschen?</h2>
        <p className="text-sm text-muted-foreground">
          Diese Aktion kann nicht rückgängig gemacht werden. Das Inserat wird dauerhaft entfernt.
        </p>
      </DrawerHeader>
      <DrawerFooter>
        <Button variant="destructive">Endgültig löschen</Button>
        <Button variant="outline">Abbrechen</Button>
      </DrawerFooter>
    </div>
  );
}
