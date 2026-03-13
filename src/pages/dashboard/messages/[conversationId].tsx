import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import type { GetServerSideProps } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/integrations/supabase/types";
import DashboardLayout from "@/components/buyauto/dashboard/DashboardLayout";
import { MessageCenterRail } from "@/components/buyauto/messages/MessageCenterRail";
import { useRouter } from "next/router";
import { getMessages, sendMessage } from "@/services/messagingService";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { SendHorizontal } from "lucide-react";

type UiMessage = {
  id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
};

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("de-CH", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardConversationPage() {
  const router = useRouter();
  const conversationIdRaw = router.query.conversationId;
  const conversationId = typeof conversationIdRaw === "string" ? conversationIdRaw : null;

  const { user, loading: authLoading, profileLoading } = useAuth();

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const isAuthed = !!user && !authLoading && !profileLoading;

  const canSend = useMemo(() => {
    return isAuthed && !!conversationId && draft.trim().length > 0 && !busy;
  }, [busy, conversationId, draft, isAuthed]);

  useEffect(() => {
    if (!conversationId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      const data = await getMessages(conversationId);
      if (cancelled) return;

      setMessages(
        data.map((m) => ({
          id: m.id,
          sender_user_id: m.sender_user_id,
          body: m.body,
          created_at: m.created_at,
        }))
      );
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  useEffect(() => {
    if (!authLoading && !profileLoading && !user) {
      router.push("/auth?redirect=" + encodeURIComponent(router.asPath));
    }
  }, [authLoading, profileLoading, router, user]);

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

  return (
    <>
      <Head>
        <title>Unterhaltung - BuyAuto</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <DashboardLayout hideSidebar leftRail={<MessageCenterRail />}>
        <Card className="rounded-3xl border border-neutral-200/60 bg-white shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900">Unterhaltung</h1>
                <p className="mt-1 text-sm text-neutral-600">Verlauf und Antworten</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-neutral-200/60 bg-neutral-50 overflow-hidden">
              <div className="max-h-[55vh] overflow-y-auto p-4 space-y-3">
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-10 bg-white rounded-xl border border-neutral-200 animate-pulse" />
                    <div className="h-10 bg-white rounded-xl border border-neutral-200 animate-pulse" />
                    <div className="h-10 bg-white rounded-xl border border-neutral-200 animate-pulse" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-sm text-neutral-600">Noch keine Nachrichten.</div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_user_id === user?.id;
                    return (
                      <div key={m.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-3 border shadow-sm",
                            isMe
                              ? "bg-neutral-900 text-white border-neutral-900"
                              : "bg-white text-neutral-900 border-neutral-200"
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
                  disabled={!isAuthed}
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
      </DashboardLayout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = createPagesServerClient<Database>(ctx);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return {
      redirect: {
        destination: "/auth",
        permanent: false,
      },
    };
  }

  return { props: {} };
};