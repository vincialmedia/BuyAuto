import { Sidebar, SidebarContent } from 'buyauto';
import { NavGroup, SidebarFrame } from './_sidebar-demo';

// SidebarMenuItem is the <li> wrapper around a SidebarMenuButton — no
// appearance of its own; the active item is the one worth seeing.
export function InSidebar() {
  return (
    <SidebarFrame>
      <Sidebar collapsible="none">
        <SidebarContent>
          <NavGroup />
        </SidebarContent>
      </Sidebar>
    </SidebarFrame>
  );
}
