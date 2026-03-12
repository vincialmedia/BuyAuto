"use client";

import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export interface MessageCenterSheetProps {
  count: number;
  triggerVariant?: "ghost" | "outline" | "default";
  triggerClassName?: string;
}

function formatCount(count: number): string {
  if (count <= 0) return "0";
  if (count >= 10) return "9+";
  return String(count);
}

export function MessageCenterSheet({
  count,
  triggerVariant = "ghost",
  triggerClassName,
}: MessageCenterSheetProps) {
  const formatted = formatCount(count);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant={triggerVariant}
          className={triggerClassName}
          aria-label="Message Center öffnen"
        >
          <span className="relative inline-flex items-center">
            <MessageSquare className="h-4 w-4" />
            <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-[18px] text-center">
              {formatted}
            </span>
          </span>
          <span className="ml-2 hidden sm:inline">Message Center</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Message Center</SheetTitle>
        </SheetHeader>

        <div className="mt-6 rounded-3xl border border-neutral-200/60 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold tracking-tight text-neutral-900">Keine Nachrichten</div>
          <div className="mt-1 text-sm text-neutral-600">Keine Nachrichten im Message Center</div>
        </div>
      </SheetContent>
    </Sheet>
  );
}