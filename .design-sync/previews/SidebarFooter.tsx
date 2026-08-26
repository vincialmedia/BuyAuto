import { Avatar, AvatarFallback, Sidebar, SidebarContent, SidebarFooter } from 'buyauto';
import { NavGroup, SidebarFrame } from './_sidebar-demo';

// SidebarFooter is the padded slot pinned below the scrollable content —
// conventionally the account row.
export function InSidebar() {
  return (
    <SidebarFrame>
      <Sidebar collapsible="none">
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
    </SidebarFrame>
  );
}
