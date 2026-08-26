import { ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut } from 'buyauto';

// ContextMenuLabel is the small bold heading inside an open context menu.
//
// It cannot be shown inside a real ContextMenuContent: that component wraps
// its children in a Radix Portal, so the panel mounts on document.body and
// never reaches the capture root — the first attempt produced a completely
// blank card. A context menu also only opens on right-click, which a static
// capture cannot perform, and Radix's ContextMenu root takes no controlled
// `open`.
//
// So the panel chrome here is PREVIEW SCAFFOLDING, deliberately marked as
// such — the plain div carries the same surface classes ContextMenuContent
// uses. ContextMenuLabel, ContextMenuSeparator and ContextMenuShortcut are the
// real components.
export function OnMenuSurface() {
  return (
    <div className="w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
      <ContextMenuLabel>Inserat</ContextMenuLabel>
      <ContextMenuSeparator />
      <div className="flex items-center px-2 py-1.5 text-sm">
        Bearbeiten
        <ContextMenuShortcut>⌘E</ContextMenuShortcut>
      </div>
      <div className="flex items-center px-2 py-1.5 text-sm">
        Duplizieren
        <ContextMenuShortcut>⌘D</ContextMenuShortcut>
      </div>
      <ContextMenuSeparator />
      <div className="px-2 py-1.5 text-sm">Löschen</div>
    </div>
  );
}

export function Inset() {
  return (
    <div className="w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
      <ContextMenuLabel>Ohne inset</ContextMenuLabel>
      <ContextMenuLabel inset>Mit inset</ContextMenuLabel>
    </div>
  );
}
