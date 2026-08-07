// Shared composition for the Sidebar family previews.
//
// Not a component preview itself — the leading underscore keeps it from
// matching any exported component name, so the converter never treats it as a
// card. The eleven Sidebar sub-parts each render nothing on their own, and
// every one of them needs the same non-trivial scaffolding, so it lives here
// once instead of being copy-pasted eleven times.
//
// Two things make Sidebar renderable inside a preview card at all:
//   - SidebarProvider is mandatory; useSidebar() throws outside it.
//   - collapsible="none" skips the offcanvas/mobile machinery, which would
//     otherwise render the sidebar off-screen or as a sheet.
//   - The provider's wrapper is min-h-svh, so it is boxed in a fixed height
//     here; without that every sidebar card would be a full viewport tall.
import * as React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from 'buyauto';
import { Car, Heart, LayoutDashboard, MessageSquare, Settings } from 'lucide-react';

export const NAV = [
  { title: 'Übersicht', icon: LayoutDashboard, active: true },
  { title: 'Meine Inserate', icon: Car },
  { title: 'Merkliste', icon: Heart },
  { title: 'Nachrichten', icon: MessageSquare },
  { title: 'Einstellungen', icon: Settings },
];

/** Boxes the provider so a sidebar card is card-sized, not viewport-sized. */
export function SidebarFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-[340px] w-full max-w-md overflow-hidden rounded-lg border">
      <SidebarProvider className="min-h-full">{children}</SidebarProvider>
    </div>
  );
}

/** The standard nav body, used as filler around whichever part is on show. */
export function NavGroup({ label = 'Dashboard' }: { label?: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {NAV.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton isActive={item.active}>
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

/** Full sidebar with the standard nav — the base every family cell builds on. */
export function BasicSidebar() {
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
