"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getMyMessageThreads, type MessageThreadItem } from "@/services/messagingService";

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
  const [threads, setThreads] = useState<MessageThreadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const data = await getMyMessageThreads(25);
      if (!cancelled) setThreads(data);
      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant={triggerVariant} className={triggerClassName} aria-label="Message Center öffnen">
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

        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="rounded-3xl border border-neutral-200/60 bg-white p-5 shadow-sm">
              <div className="h-4 w-28 rounded bg-neutral-200 animate-pulse" />
              <div className="mt-3 h-3 w-44 rounded bg-neutral-100 animate-pulse" />
            </div>
          ) : threads.length === 0 ? (
            <div className="rounded-3xl border border-neutral-200/60 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold tracking-tight text-neutral-900">Keine Nachrichten</div>
              <div className="mt-1 text-sm text-neutral-600">Keine Nachrichten im Message Center</div>
            </div>
          ) : (
            threads.map((t) => (
              <button
                key={t.conversationId}
                className="w-full text-left rounded-3xl border border-neutral-200/60 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                type="button"
              >
                <div className="flex gap-3">
                  <div className="relative h-14 w-20 overflow-hidden rounded-2xl bg-neutral-100">
                    {t.coverImageUrl ? (
                      <Image src={t.coverImageUrl} alt={t.listingTitle} fill className="object-cover" sizes="80px" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold tracking-tight text-neutral-900">
                          {t.buyerName} - {t.listingMakeModel}
                        </div>
                        <div className="mt-1 line-clamp-1 text-xs text-neutral-600">{t.lastMessagePreview || " "}</div>
                      </div>
                      <div className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">
                        {t.messageCount >= 10 ? "9+" : String(t.messageCount)}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}