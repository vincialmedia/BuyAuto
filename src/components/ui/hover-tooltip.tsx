import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useHasMounted } from "@/hooks/use-has-mounted";

export interface HoverTooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  contentClassName?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

export function HoverTooltip({
  children,
  content,
  contentClassName,
  side = "top",
  align = "center",
  sideOffset = 8,
}: HoverTooltipProps) {
  const hasMounted = useHasMounted();
  const [open, setOpen] = React.useState(false);
  const [hoverCapable, setHoverCapable] = React.useState(false);
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = React.useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = React.useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 120);
  }, [clearCloseTimer]);

  React.useEffect(() => {
    if (!hasMounted) return;
    setHoverCapable(window.matchMedia("(hover: hover) and (pointer: fine)").matches);
  }, [hasMounted]);

  React.useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  const bubbleClassName = cn(
    "rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-xs text-white shadow-xl",
    contentClassName
  );

  const portalContent = (
    <PopoverContent
      side={side}
      align={align}
      sideOffset={sideOffset}
      onMouseEnter={hoverCapable ? clearCloseTimer : undefined}
      onMouseLeave={hoverCapable ? scheduleClose : undefined}
      className="w-auto border-0 bg-transparent p-0 shadow-none"
    >
      <div className={bubbleClassName}>{content}</div>
    </PopoverContent>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        asChild
        onMouseEnter={
          hoverCapable
            ? () => {
                clearCloseTimer();
                setOpen(true);
              }
            : undefined
        }
        onMouseLeave={hoverCapable ? scheduleClose : undefined}
      >
        {children as React.ReactElement}
      </PopoverTrigger>
      {portalContent}
    </Popover>
  );
}