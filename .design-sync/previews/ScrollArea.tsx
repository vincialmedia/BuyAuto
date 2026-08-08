import { ScrollArea, Separator } from 'buyauto';

// ScrollArea needs an explicit height and more content than fits, otherwise it
// is an ordinary div and the card shows nothing distinctive.
export function CantonList() {
  return (
    <ScrollArea className="h-56 w-64 rounded-md border">
      <div className="p-4">
        <div className="mb-2 text-sm font-medium">Kantone</div>
        {['Aargau','Appenzell Innerrhoden','Bern','Basel-Landschaft','Basel-Stadt','Freiburg','Genf','Glarus','Graubünden','Jura','Luzern','Neuenburg','St. Gallen','Solothurn','Thurgau','Tessin','Waadt','Wallis','Zug','Zürich'].map((c) => (
          <div key={c}><div className="py-1.5 text-sm">{c}</div><Separator /></div>
        ))}
      </div>
    </ScrollArea>
  );
}
