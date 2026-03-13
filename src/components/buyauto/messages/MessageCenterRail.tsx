import { MessageSquare } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { getMyMessageThreads, type MessageThreadItem } from "@/services/messagingService";
import { cn } from "@/lib/utils";

function formatTimeCH(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("de-CH", {
    timeZone: "Europe/Zurich",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatUnread(count: number): string {
  if (count <= 0) return "";
  if (count >= 10) return "9+";
  return String(count);
}

export function MessageCenterRail() {
  const router = useRouter();
  const [threads, setThreads] = useState<MessageThreadItem[]>([]);
  const [loading, setLoading] = useState(true);

  const activeConversationId = useMemo(() => {
    const raw = router.query.conversationId;
    return typeof raw === "string" ? raw : null;
  }, [router.query.conversationId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const data = await getMyMessageThreads(50);
      if (!cancelled) setThreads(data);
      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router.asPath]);

  return (
    <div className="rounded-3xl border border-neutral-200/60 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <MessageSquare className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold tracking-tight text-neutral-900">Message Center</div>
          <div className="text-xs text-neutral-600">Kommunikation pro Inserat</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {loading ? (
          <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50/50 p-4">
            <div className="h-4 w-28 rounded bg-neutral-200 animate-pulse" />
            <div className="mt-3 h-3 w-44 rounded bg-neutral-100 animate-pulse" />
          </div>
        ) : threads.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50/50 p-4">
            <div className="text-sm text-neutral-700">Keine Nachrichten im Message Center</div>
          </div>
        ) : (
          threads.map((t) => {
            const isActive = activeConversationId === t.conversationId;
            const unreadLabel = formatUnread(t.unreadCount);

            return (
              <button
                key={t.conversationId}
                className={cn(
                  "w-full text-left rounded-3xl border p-4 shadow-sm transition-all",
                  isActive
                    ? "border-neutral-900 bg-neutral-900 text-white shadow-md"
                    : "border-neutral-200/60 bg-white hover:shadow-md"
                )}
                type="button"
                onClick={() => router.push(`/dashboard/messages/${t.conversationId}`)}
              >
                <div className="flex gap-3">
                  <div className="relative h-14 w-20 overflow-hidden rounded-2xl bg-neutral-100">
                    {t.coverImageUrl ? (
                      <Image src={t.coverImageUrl} alt={t.listingMakeModel} fill className="object-cover" sizes="80px" />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={cn("truncate text-sm font-bold tracking-tight", isActive ? "text-white" : "text-neutral-900")}>
                          {t.title}
                        </div>
                        <div className={cn("mt-1 line-clamp-1 text-xs", isActive ? "text-white/80" : "text-neutral-600")}>
                          {t.lastMessagePreview || " "}
                        </div>
                      </div>

                      {unreadLabel ? (
                        <div
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
                            isActive ? "bg-white/15 text-white" : "bg-red-50 text-red-700"
                          )}
                          aria-label="Ungelesene Nachrichten"
                        >
                          {unreadLabel}
                        </div>
                      ) : null}
                    </div>

                    {t.lastMessageAt ? (
                      <div className={cn("mt-2 text-[11px]", isActive ? "text-white/70" : "text-neutral-500")}>
                        {formatTimeCH(t.lastMessageAt)}
                      </div>
                    ) : null}

                    <div className="mt-2">
                      {t.conversationStatus === "archived" ? (
                        <span className={cn("text-[11px] font-semibold", isActive ? "text-white/70" : "text-neutral-500")}>
                          Archiviert
                        </span>
                      ) : t.conversationStatus === "buyer_selected" ? (
                        <span className={cn("text-[11px] font-semibold", isActive ? "text-white/70" : "text-neutral-500")}>
                          Käufer ausgewählt
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}