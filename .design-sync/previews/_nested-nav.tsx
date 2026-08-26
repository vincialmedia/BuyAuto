// Shared composition for the nested-nav Sidebar parts (SidebarMenuSub,
// SidebarMenuSubItem, SidebarMenuSubButton).
//
// Underscore-prefixed so it matches no component name. It has to be a helper
// module rather than a sibling-preview import: importing one <Name>.tsx preview
// from another yields an empty module at capture time and the card renders
// blank with no error.
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from 'buyauto';
import { Car, LayoutDashboard } from 'lucide-react';
import { SidebarFrame } from './_sidebar-demo';

// A nav with one expanded item, so the nested list, its left rule, and the
// active/inactive sub-rows are all visible at once.
export function NestedNav() {
  return (
    <SidebarFrame>
      <Sidebar collapsible="none">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <LayoutDashboard />
                    <span>Übersicht</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive>
                    <Car />
                    <span>Meine Inserate</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton isActive>Veröffentlicht</SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton>Entwürfe</SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton>Verkauft</SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarFrame>
  );
}
