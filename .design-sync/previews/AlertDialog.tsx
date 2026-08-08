import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from 'buyauto';

// Same as Dialog: AlertDialogContent is `fixed` and centred with
// translate-x/y-[-50%], which clips the top of the panel inside a preview
// cell. Neutralised so it renders in normal flow.
const PANEL = 'relative left-auto top-auto translate-x-0 translate-y-0';

// Forced `open` for the same reason as Dialog — the content only mounts while
// open. AlertDialog has no `modal={false}` escape hatch, which is fine: it
// renders into the portal and is captured.
export function DestructiveConfirm() {
  return (
    <AlertDialog open>
      <AlertDialogContent className={PANEL}>
        <AlertDialogHeader>
          <AlertDialogTitle>Konto wirklich löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Alle Inserate, Nachrichten und Daten werden unwiderruflich entfernt.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction>Konto löschen</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
