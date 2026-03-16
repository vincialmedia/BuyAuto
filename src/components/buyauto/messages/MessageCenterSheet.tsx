"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { getMyMessageThreads, type MessageThreadItem } from "@/services/messagingService";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

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

function formatUnread(count: number): string {
  if (count <= 0) return "";
  if (count >= 10) return "9+";
  return String(count);
}

export function MessageCenterSheet({
  count,
  triggerVariant = "ghost",
  triggerClassName,
}: MessageCenterSheetProps) {
  const router = useRouter();
  const formatted = useMemo(() => formatCount(count), [count]);
  const [threads, setThreads] = useState<MessageThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading, profileLoading } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (authLoading || profileLoading || !user) {
        setThreads([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const data = await getMyMessageThreads(25);
      if (!cancelled) setThreads(data);
      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, profileLoading, user]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant={triggerVariant} className={triggerClassName} aria-label="Message Center öffnen">
          <span className="relative inline-flex items-center">
            <MessageSquare className="h-4 w-4" />
            {count > 0 ? (
              <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-[18px] text-center">
                {formatted}
              </span>
            ) : null}
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
            threads.map((t) => {
              const unreadLabel = formatUnread(t.unreadCount);
              const isUnread = t.unreadCount > 0;

              return (
                <button
                  key={t.conversationId}
                  className={cn(
                    "w-full text-left rounded-3xl border p-4 shadow-sm hover:shadow-md transition-shadow",
                    isUnread ? "border-red-100 bg-red-50/60" : "border-neutral-200/60 bg-white"
                  )}
                  type="button"
                  onClick={() => router.push(`/dashboard/messages/${t.conversationId}`)}
                >
                  <div className="flex gap-3">
                    <div className="relative h-14 w-20 overflow-hidden rounded-2xl bg-neutral-100">
                      {t.coverImageUrl ? (
                        <Image src={t.coverImageUrl} alt={t.listingMakeModel} fill className="object-cover" sizes="80px" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-neutral-400">
                          Foto
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold tracking-tight text-neutral-900">{t.title}</div>
                          <div className="mt-1 line-clamp-1 text-xs text-neutral-600">{t.lastMessagePreview || " "}</div>
                        </div>

                        {unreadLabel ? (
                          <div className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                            {unreadLabel}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}