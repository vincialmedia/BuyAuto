import { Card, CardContent, Tabs, TabsContent, TabsList, TabsTrigger } from 'buyauto';

// `defaultValue` decides which panel is open in the capture; without it no
// panel renders and the card shows only the tab strip.
export function DashboardTabs() {
  return (
    <Tabs defaultValue="uebersicht" className="w-full max-w-lg">
      <TabsList>
        <TabsTrigger value="uebersicht">Übersicht</TabsTrigger>
        <TabsTrigger value="inserate">Inserate</TabsTrigger>
        <TabsTrigger value="abrechnung">Abrechnung</TabsTrigger>
      </TabsList>
      <TabsContent value="uebersicht">
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">
          12 aktive Inserate, 3’607 Aufrufe in den letzten 30 Tagen.
        </CardContent></Card>
      </TabsContent>
      <TabsContent value="inserate">
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">Deine Inserate.</CardContent></Card>
      </TabsContent>
    </Tabs>
  );
}

export function TwoTabs() {
  return (
    <Tabs defaultValue="privat" className="w-full max-w-md">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="privat">Privatkunde</TabsTrigger>
        <TabsTrigger value="garage">Garage</TabsTrigger>
      </TabsList>
      <TabsContent value="privat" className="text-sm text-muted-foreground">
        Ein Inserat, ein Preis — keine Abos.
      </TabsContent>
    </Tabs>
  );
}
