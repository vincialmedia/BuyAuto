import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'buyauto';
import { Fuel, Gauge, MapPin, Settings } from 'lucide-react';

// CardContent is the padded body slot — an empty div on its own.
export function InCard() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Fahrzeugdaten</CardTitle>
        <CardDescription>BMW 320d Touring · M Sport</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Gauge className="size-4" /> 42’000 km
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Fuel className="size-4" /> Diesel
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Settings className="size-4" /> Automatik
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="size-4" /> Zürich
        </span>
      </CardContent>
    </Card>
  );
}

// Without a CardHeader the content needs its own top padding — the stat-tile
// pattern the dashboard uses.
export function StandaloneBody() {
  return (
    <div className="flex flex-wrap gap-4">
      {[
        { label: 'Aktive Inserate', value: '12' },
        { label: 'Aufrufe (30 Tage)', value: '3’607' },
        { label: 'Anfragen', value: '48' },
      ].map((s) => (
        <Card key={s.label} className="w-44">
          <CardContent className="pt-6">
            <div className="text-2xl font-semibold tabular-nums">{s.value}</div>
            <div className="text-sm text-muted-foreground">{s.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
