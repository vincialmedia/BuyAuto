import { StatusBadge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'buyauto';

// A <td> only has appearance inside a table — borders, padding and alignment
// all come from the surrounding structure.
export function InTable() {
  return (
    <Table className="w-full max-w-xl">
      <TableHeader>
        <TableRow>
          <TableHead>Fahrzeug</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">BMW 320d Touring</TableCell>
          <TableCell>
            <StatusBadge status="published" />
          </TableCell>
          <TableCell className="text-right tabular-nums">CHF 489</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Audi Q5 40 TDI quattro</TableCell>
          <TableCell>
            <StatusBadge status="pending" />
          </TableCell>
          <TableCell className="text-right tabular-nums">CHF 749</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">VW Golf GTI</TableCell>
          <TableCell>
            <StatusBadge status="sold" />
          </TableCell>
          <TableCell className="text-right tabular-nums">CHF 399</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

// colSpan is the idiom for an empty-state row.
export function SpanningCell() {
  return (
    <Table className="w-full max-w-xl">
      <TableHeader>
        <TableRow>
          <TableHead>Fahrzeug</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={3} className="text-center text-muted-foreground">
            Noch keine Inserate — erstelle dein erstes Inserat.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
