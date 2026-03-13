import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getMessages, getOrCreateConversationForListing, sendMessage } from "@/services/messagingService";
import { LogIn, SendHorizontal } from "lucide-react";
import { useRouter } from "next/router";

export interface MessagingPanelProps {
  listingId: string;
  listingTitle: string;
  className?: string;
}

type UiMessage = {
  id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
};

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("de-CH", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function MessagingPanel({ listingId, listingTitle, className }: MessagingPanelProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isAuthed = !!user && !loading;

  const canSend = useMemo(() => {
    return isAuthed && !!conversationId && draft.trim().length > 0 && !busy;
  }, [busy, conversationId, draft, isAuthed]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!isAuthed) {
        setConversationId(null);
        setMessages([]);
        setInitialLoading(false);
        return;
      }

      setInitialLoading(true);
      const conv = await getOrCreateConversationForListing(listingId);
      if (cancelled) return;

      const convId = conv?.id ?? null;
      setConversationId(convId);

      if (!convId) {
        setMessages([]);
        setInitialLoading(false);
        return;
      }

      const data = await getMessages(convId);
      if (cancelled) return;

      setMessages(
        data.map((m) => ({
          id: m.id,
          sender_user_id: m.sender_user_id,
          body: m.body,
          created_at: m.created_at,
        }))
      );
      setInitialLoading(false);
    }

    boot();

    return () => {
      cancelled = true;
    };
  }, [isAuthed, listingId]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  async function handleSend() {
    if (!conversationId) return;
    const body = draft.trim();
    if (!body) return;

    setBusy(true);
    const ok = await sendMessage(conversationId, body);

    if (ok) {
      setDraft("");
      const data = await getMessages(conversationId);
      setMessages(
        data.map((m) => ({
          id: m.id,
          sender_user_id: m.sender_user_id,
          body: m.body,
          created_at: m.created_at,
        }))
      );
    }

    setBusy(false);
  }

  if (!isAuthed) {
    return (
      <Card className={cn("border-neutral-200/60 shadow-sm bg-white rounded-3xl overflow-hidden", className)}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900">Nachrichten</p>
              <p className="text-sm text-neutral-600 mt-1">
                Einloggen/Registrieren um Nachrichten zu schicken.
              </p>
              <p className="text-xs text-neutral-500 mt-2">
                Chat-Verlauf bleibt beim Inserat „{listingTitle}“ gespeichert.
              </p>
            </div>

            <Button
              className="bg-neutral-900 hover:bg-neutral-800 text-white"
              onClick={() => router.push("/auth?redirect=" + encodeURIComponent(router.asPath))}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Einloggen
            </Button>
          </div>

          <div className="mt-5 rounded-2xl border border-neutral-200 bg-neutral-50 p-4 opacity-60">
            <div className="h-24 rounded-xl bg-white/70 border border-neutral-200" />
            <div className="mt-3 h-10 rounded-xl bg-white/70 border border-neutral-200" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-neutral-200/60 shadow-sm bg-white rounded-3xl overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-neutral-900">Nachrichten</p>
            <p className="text-sm text-neutral-600 mt-1">
              Schreibe direkt dem Anbieter. Verlauf bleibt bei diesem Inserat gespeichert.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-neutral-200/60 bg-neutral-50 overflow-hidden">
          <div ref={scrollRef} className="max-h-72 overflow-y-auto p-4 space-y-3">
            {initialLoading ? (
              <div className="space-y-2">
                <div className="h-10 bg-white rounded-xl border border-neutral-200 animate-pulse" />
                <div className="h-10 bg-white rounded-xl border border-neutral-200 animate-pulse" />
                <div className="h-10 bg-white rounded-xl border border-neutral-200 animate-pulse" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-sm text-neutral-600">
                Noch keine Nachrichten. Starte die Unterhaltung.
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.sender_user_id === user?.id;
                return (
                  <div key={m.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-3 border shadow-sm",
                        isMe ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-900 border-neutral-200"
                      )}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.body}</p>
                      <p className={cn("text-[11px] mt-2", isMe ? "text-white/70" : "text-neutral-500")}>
                        {formatTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-neutral-200/60 bg-white p-4">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Nachricht schreiben…"
              className="min-h-[92px] rounded-2xl border-neutral-200 focus:border-neutral-400"
            />
            <div className="mt-3 flex items-center justify-end">
              <Button
                onClick={handleSend}
                disabled={!canSend}
                className="bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl"
              >
                <SendHorizontal className="h-4 w-4 mr-2" />
                Senden
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}