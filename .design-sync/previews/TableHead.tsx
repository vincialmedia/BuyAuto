import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'buyauto';

// TableHead is the <th> — muted, medium-weight, and only visible as part of a
// header row.
export function InTable() {
  return (
    <Table className="w-full max-w-xl">
      <TableHeader>
        <TableRow>
          <TableHead>Fahrzeug</TableHead>
          <TableHead>Kanton</TableHead>
          <TableHead className="text-right">Aufrufe</TableHead>
          <TableHead className="text-right">Rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">BMW 320d Touring</TableCell>
          <TableCell>Zürich</TableCell>
          <TableCell className="text-right tabular-nums">1’284</TableCell>
          <TableCell className="text-right tabular-nums">CHF 489</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Audi Q5 40 TDI quattro</TableCell>
          <TableCell>Bern</TableCell>
          <TableCell className="text-right tabular-nums">312</TableCell>
          <TableCell className="text-right tabular-nums">CHF 749</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
