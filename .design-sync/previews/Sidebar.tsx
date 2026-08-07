import {
  Avatar,
  AvatarFallback,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from 'buyauto';
import { Car } from 'lucide-react';
import { NavGroup, SidebarFrame } from './_sidebar-demo';

// NOTE: the whole Sidebar family depends on --sidebar-* CSS variables that the
// repo never defines (tailwind.config maps them, nothing declares them). They
// are supplied by the export-only block in .design-sync/css/entry.css — see
// NOTES.md. Without it every one of these renders with invalid colours.

export function Complete() {
  return (
    <div className="h-[360px] w-full max-w-2xl overflow-hidden rounded-lg border">
      <SidebarProvider className="min-h-full">
        <Sidebar collapsible="none">
          <SidebarHeader>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Car className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">BuyAuto</div>
                <div className="truncate text-xs text-muted-foreground">Garage Meier AG</div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <NavGroup />
          </SidebarContent>
          <SidebarFooter>
            <div className="flex items-center gap-2 px-2 py-1.5">
              <Avatar className="size-8">
                <AvatarFallback className="text-xs">VH</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">Vincent Hänggi</div>
                <div className="truncate text-xs text-muted-foreground">vincent@buyauto.ch</div>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="min-h-0 p-4">
          <h3 className="text-base font-semibold">Übersicht</h3>
          <p className="mt-1 text-sm text-muted-foreground">Inhaltsbereich neben der Sidebar.</p>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

// Right-hand placement.
//
// IMPORTANT, and easy to get wrong: the `side` prop is a NO-OP when
// collapsible="none" — that branch of the component returns a plain flex
// column and never reads `side` at all (side is only honoured by the
// offcanvas/icon variants and the mobile Sheet). With collapsible="none" the
// placement comes purely from DOM order, so the sidebar goes AFTER
// SidebarInset.
export function RightSide() {
  return (
    <div className="h-[340px] w-full max-w-2xl overflow-hidden rounded-lg border">
      <SidebarProvider className="min-h-full">
        <SidebarInset className="min-h-0 p-4">
          <h3 className="text-base font-semibold">Suchergebnisse</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            1’284 Fahrzeuge — Filter rechts.
          </p>
        </SidebarInset>
        <Sidebar collapsible="none">
          <SidebarContent>
            <NavGroup label="Filter" />
          </SidebarContent>
        </Sidebar>
      </SidebarProvider>
    </div>
  );
}
