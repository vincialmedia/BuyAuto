import { NestedNav } from './_nested-nav';

// SidebarMenuSubItem is the <li> inside SidebarMenuSub — no appearance apart
// from the nested list it sits in, so it shares that composition.
export function InNestedNav() {
  return <NestedNav />;
}
