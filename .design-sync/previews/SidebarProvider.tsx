import { Sidebar, SidebarContent, SidebarInset, SidebarProvider } from 'buyauto';
import { NavGroup } from './_sidebar-demo';

// SidebarProvider is context plus a full-height flex wrapper — it paints
// nothing itself, so it only reads as anything with a Sidebar inside it.
// Every other Sidebar component throws without it (useSidebar()).
export function WithSidebarAndContent() {
  return (
    <div className="h-[340px] w-full max-w-2xl overflow-hidden rounded-lg border">
      <SidebarProvider className="min-h-full">
        <Sidebar collapsible="none">
          <SidebarContent>
            <NavGroup />
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="min-h-0 p-4">
          <h3 className="text-base font-semibold">Übersicht</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Der Inhaltsbereich neben der Sidebar. SidebarInset füllt den Rest der Breite.
          </p>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
