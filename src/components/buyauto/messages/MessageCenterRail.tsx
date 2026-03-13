import { MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { getMyMessageThreads, type MessageThreadItem } from "@/services/messagingService";

export function MessageCenterRail() {
  const router = useRouter();
  const [threads, setThreads] = useState<MessageThreadItem[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

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
          threads.map((t) => (
            <button
              key={t.conversationId}
              className="w-full text-left rounded-3xl border border-neutral-200/60 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
              type="button"
              onClick={() => router.push(`/dashboard/messages/${t.conversationId}`)}
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
                        {t.listingMakeModel}
                      </div>
                      <div className="mt-1 line-clamp-1 text-xs text-neutral-600">{t.lastMessagePreview || " "}</div>
                    </div>
                    <div className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">
                      {t.messageCount >= 10 ? "9+" : String(t.messageCount)}
                    </div>
                  </div>

                  {t.lastMessageAt ? (
                    <div className="mt-2 text-[11px] text-neutral-500">
                      {new Date(t.lastMessageAt).toLocaleString("de-CH", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}