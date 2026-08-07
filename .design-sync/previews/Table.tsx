import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  StatusBadge,
} from 'buyauto';

const rows = [
  { title: 'BMW 320d Touring', status: 'published' as const, views: 1284, rate: 489 },
  { title: 'Audi Q5 40 TDI quattro', status: 'pending' as const, views: 312, rate: 749 },
  { title: 'VW Golf GTI', status: 'sold' as const, views: 2011, rate: 399 },
  { title: 'Tesla Model 3 Long Range', status: 'draft' as const, views: 0, rate: 629 },
];

// The dashboard's listing table, which is what Table is actually for here.
export function ListingsTable() {
  return (
    <Table className="w-full max-w-2xl">
      <TableHeader>
        <TableRow>
          <TableHead>Fahrzeug</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Aufrufe</TableHead>
          <TableHead className="text-right">Rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.title}>
            <TableCell className="font-medium">{r.title}</TableCell>
            <TableCell>
              <StatusBadge status={r.status} />
            </TableCell>
            <TableCell className="text-right tabular-nums">{r.views.toLocaleString('de-CH')}</TableCell>
            <TableCell className="text-right tabular-nums">CHF {r.rate}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function WithCaptionAndFooter() {
  return (
    <Table className="w-full max-w-2xl">
      <TableCaption>Aufrufe der letzten 30 Tage</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Fahrzeug</TableHead>
          <TableHead className="text-right">Aufrufe</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.title}>
            <TableCell className="font-medium">{r.title}</TableCell>
            <TableCell className="text-right tabular-nums">{r.views.toLocaleString('de-CH')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell>Total</TableCell>
          <TableCell className="text-right tabular-nums">
            {rows.reduce((a, r) => a + r.views, 0).toLocaleString('de-CH')}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
