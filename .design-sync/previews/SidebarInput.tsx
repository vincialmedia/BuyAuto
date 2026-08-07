import { Sidebar, SidebarContent, SidebarHeader, SidebarInput } from 'buyauto';
import { NavGroup, SidebarFrame } from './_sidebar-demo';

// SidebarInput is the search field styled for the sidebar surface — an empty
// outline unless it has a value or placeholder and the sidebar behind it.
export function SearchInHeader() {
  return (
    <SidebarFrame>
      <Sidebar collapsible="none">
        <SidebarHeader>
          <SidebarInput placeholder="Inserate durchsuchen…" />
        </SidebarHeader>
        <SidebarContent>
          <NavGroup />
        </SidebarContent>
      </Sidebar>
    </SidebarFrame>
  );
}

export function WithValue() {
  return (
    <SidebarFrame>
      <Sidebar collapsible="none">
        <SidebarHeader>
          <SidebarInput defaultValue="BMW 320d" />
        </SidebarHeader>
        <SidebarContent>
          <NavGroup />
        </SidebarContent>
      </Sidebar>
    </SidebarFrame>
  );
}
