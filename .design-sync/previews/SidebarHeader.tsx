import { Sidebar, SidebarContent, SidebarHeader } from 'buyauto';
import { Car } from 'lucide-react';
import { NavGroup, SidebarFrame } from './_sidebar-demo';

// SidebarHeader is the padded slot at the top of the sidebar — an empty div on
// its own.
export function InSidebar() {
  return (
    <SidebarFrame>
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
      </Sidebar>
    </SidebarFrame>
  );
}
