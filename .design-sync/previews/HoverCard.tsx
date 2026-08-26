import { Avatar, AvatarFallback, Button, HoverCard, HoverCardContent, HoverCardTrigger } from 'buyauto';

// Forced `open` — hover cannot be simulated in a static capture.
export function GarageProfile() {
  return (
    <div className="relative h-64">
      <HoverCard open>
        <HoverCardTrigger asChild><Button variant="link">Garage Meier AG</Button></HoverCardTrigger>
        <HoverCardContent align="start" className="w-80">
          <div className="flex gap-3">
            <Avatar><AvatarFallback>MK</AvatarFallback></Avatar>
            <div className="flex flex-col gap-1">
              <div className="text-sm font-semibold">Garage Meier AG</div>
              <div className="text-sm text-muted-foreground">
                Offizieller BMW-Partner in Zürich. Seit 2019 auf BuyAuto, 34 aktive Inserate.
              </div>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
