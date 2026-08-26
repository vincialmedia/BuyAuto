import { Sidebar, SidebarContent } from 'buyauto';
import { NavGroup, SidebarFrame } from './_sidebar-demo';

// SidebarGroupLabel is the small muted caption above a group's items.
export function InSidebar() {
  return (
    <SidebarFrame>
      <Sidebar collapsible="none">
        <SidebarContent>
          <NavGroup label="Dashboard" />
          <NavGroup label="Zweite Gruppe" />
        </SidebarContent>
      </Sidebar>
    </SidebarFrame>
  );
}
