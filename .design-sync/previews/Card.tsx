import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from 'buyauto';
import { Fuel, Gauge, MapPin } from 'lucide-react';

// Card is a shell — on its own it is an empty rounded box, which is why its
// unauthored card came up blank. Every cell here is a real composition, since
// the composition IS the component's appearance.

export function Basic() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Leasingübernahme</CardTitle>
        <CardDescription>
          Übernimm einen laufenden Leasingvertrag — ohne Anzahlung und ohne Neuabschluss.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Du übernimmst die verbleibenden Raten und fährst sofort los. Der Vertrag läuft zu
          den bestehenden Konditionen weiter.
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button>Fahrzeuge suchen</Button>
        <Button variant="ghost">Mehr erfahren</Button>
      </CardFooter>
    </Card>
  );
}

// The shape the app actually uses most: a vehicle summary card.
export function VehicleSummary() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>BMW 320d Touring</CardTitle>
            <CardDescription>M Sport · 2022</CardDescription>
          </div>
          <Badge>Premium</Badge>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Gauge className="size-4" /> 42’000 km
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Fuel className="size-4" /> Diesel
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="size-4" /> Zürich
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">Automatik</span>
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

// Header-only and content-only are both legitimate — the parts are optional.
export function Minimal() {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <Card className="w-56">
        <CardHeader>
          <CardTitle>Nur Header</CardTitle>
          <CardDescription>Titel und Beschreibung</CardDescription>
        </CardHeader>
      </Card>
      <Card className="w-56">
        <CardContent className="pt-6">
          <div className="text-2xl font-semibold">1’284</div>
          <div className="text-sm text-muted-foreground">Aktive Inserate</div>
        </CardContent>
      </Card>
    </div>
  );
}
