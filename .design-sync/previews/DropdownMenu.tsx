import { Button, DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from 'buyauto';
import { LogOut, Settings, User } from 'lucide-react';

// Open + non-modal so the panel mounts beside its trigger in the capture.
export function AccountMenu() {
  return (
    <div className="relative h-64">
      <DropdownMenu open modal={false}>
        <DropdownMenuTrigger asChild><Button variant="outline">Mein Konto</Button></DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={6} className="w-56">
          <DropdownMenuLabel>Mein Konto</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem><User className="mr-2 size-4" />Profil
            <DropdownMenuShortcut>⌘P</DropdownMenuShortcut></DropdownMenuItem>
          <DropdownMenuItem><Settings className="mr-2 size-4" />Einstellungen</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem><LogOut className="mr-2 size-4" />Abmelden</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function WithCheckboxes() {
  return (
    <div className="relative h-64">
      <DropdownMenu open modal={false}>
        <DropdownMenuTrigger asChild><Button variant="outline">Spalten</Button></DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={6} className="w-56">
          <DropdownMenuLabel>Sichtbare Spalten</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked>Fahrzeug</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked>Status</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem>Aufrufe</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
