import { Menubar, MenubarMenu, MenubarTrigger } from 'buyauto';

// A Menubar with no menus is a bare 36px bar — hence the blank card. Menu
// content only mounts when a menu is open, which a static capture cannot do,
// so the closed bar with its triggers is the honest rendering.
export function Closed() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>Datei</MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Bearbeiten</MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Ansicht</MenubarTrigger>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Hilfe</MenubarTrigger>
      </MenubarMenu>
    </Menubar>
  );
}
