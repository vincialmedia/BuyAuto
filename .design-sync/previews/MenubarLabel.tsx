import { MenubarLabel, MenubarSeparator } from 'buyauto';

// MenubarLabel is the small bold heading inside an open menu panel.
//
// It cannot be shown inside a real MenubarContent: that component wraps its
// children in a Radix Portal, so the panel mounts on document.body and never
// lands in the capture root — the first attempt produced a completely blank
// card. Radix's Menubar root also has no controlled `open`, so there is no way
// to open a menu statically.
//
// So the panel chrome here is PREVIEW SCAFFOLDING, deliberately marked as
// such — the plain div carries the same surface classes MenubarContent uses
// (border, rounded-md, shadow-md, p-1). MenubarLabel and MenubarSeparator
// themselves are the real components.
export function OnMenuSurface() {
  return (
    <div className="w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
      <MenubarLabel>Inserat</MenubarLabel>
      <MenubarSeparator />
      <div className="px-2 py-1.5 text-sm">Neues Inserat</div>
      <div className="px-2 py-1.5 text-sm">Speichern</div>
      <MenubarSeparator />
      <MenubarLabel>Veröffentlichung</MenubarLabel>
      <div className="px-2 py-1.5 text-sm">Jetzt veröffentlichen</div>
    </div>
  );
}

// The label with `inset` shifts right to line up with items that have icons.
export function Inset() {
  return (
    <div className="w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
      <MenubarLabel>Ohne inset</MenubarLabel>
      <MenubarLabel inset>Mit inset</MenubarLabel>
    </div>
  );
}
