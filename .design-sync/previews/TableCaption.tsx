import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from 'buyauto';

// TableCaption renders below the table as muted small text — nothing at all
// without a table to caption.
export function InTable() {
  return (
    <Table className="w-full max-w-xl">
      <TableCaption>Aufrufe deiner Inserate in den letzten 30 Tagen</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Fahrzeug</TableHead>
          <TableHead className="text-right">Aufrufe</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium">BMW 320d Touring</TableCell>
          <TableCell className="text-right tabular-nums">1’284</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Audi Q5 40 TDI quattro</TableCell>
          <TableCell className="text-right tabular-nums">312</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">VW Golf GTI</TableCell>
          <TableCell className="text-right tabular-nums">2’011</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
