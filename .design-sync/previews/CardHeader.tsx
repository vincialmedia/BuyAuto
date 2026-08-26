import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from 'buyauto';

// CardHeader is a padded flex column — invisible without a Card around it and
// content inside it.
export function InCard() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Leasingübernahme</CardTitle>
        <CardDescription>
          Übernimm einen laufenden Vertrag ohne Neuabschluss.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Der Rest der Karte, damit das Padding des Headers ablesbar ist.
      </CardContent>
    </Card>
  );
}

// Headers commonly carry a trailing action or badge on the same row.
export function WithTrailingBadge() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>BMW 320d Touring</CardTitle>
            <CardDescription>M Sport · 2022</CardDescription>
          </div>
          <Badge>Premium</Badge>
        </div>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">42’000 km · Zürich</CardContent>
    </Card>
  );
}
