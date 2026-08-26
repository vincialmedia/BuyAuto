import { Button, Card, CardContent, CardFooter, CardHeader, CardTitle } from 'buyauto';

// CardFooter is the trailing action row — a flex container with padding, so it
// shows nothing until a Card and some actions surround it.
export function InCard() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Inserat veröffentlichen</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Dein Inserat wird nach der Prüfung freigeschaltet.
      </CardContent>
      <CardFooter className="gap-2">
        <Button>Veröffentlichen</Button>
        <Button variant="ghost">Als Entwurf speichern</Button>
      </CardFooter>
    </Card>
  );
}

// Price on the left, action on the right — the listing-card footer.
export function SplitLayout() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>BMW 320d Touring</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Noch 23 Monate Restlaufzeit · 42’000 km
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div>
          <div className="text-xs text-muted-foreground">ab</div>
          <div className="text-lg font-semibold">CHF 489/Mt.</div>
        </div>
        <Button>Details</Button>
      </CardFooter>
    </Card>
  );
}
