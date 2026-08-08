import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'buyauto';
import { Info } from 'lucide-react';

// Tooltips need TooltipProvider, and `open` forced — a hover cannot be
// performed by a static capture.
export function Open() {
  return (
    <TooltipProvider>
      <div className="relative flex h-32 items-end gap-4">
        <Tooltip open>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Info"><Info /></Button>
          </TooltipTrigger>
          <TooltipContent side="top">Richtwert, keine verbindliche Offerte</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
