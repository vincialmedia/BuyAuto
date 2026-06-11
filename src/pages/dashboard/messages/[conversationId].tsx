import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/integrations/supabase/types";
import DashboardLayout from "@/components/buyauto/dashboard/DashboardLayout";
import { MessageCenterRail } from "@/components/buyauto/messages/MessageCenterRail";
import { useRouter } from "next/router";
import {
  archiveConversation,
  createSignedAttachmentUrl,
  getConversationContext,
  getMessages,
  markConversationRead,
  selectBuyerAndMarkListingSold,
  sendMessage,
  sendMessageWithAttachments,
} from "@/services/messagingService";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { SendHorizontal, CheckCircle2, Archive, ArrowLeft, Paperclip, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { buildListingHref } from "@/lib/buyauto/listingUrl";

type UiAttachment = {
  id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
};

type UiMessage = {
  id: string;
  sender_user_id: string;
  body: string;
  created_at: string;
  attachments: UiAttachment[];
};

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

function formatChf(value: number | null | undefined): string {
  if (!value || !Number.isFinite(value)) return "";
  return new Intl.NumberFormat("de-CH").format(value);
}

function formatBytes(value: number | null | undefined): string {
  if (!value || !Number.isFinite(value)) return "";
  const units = ["B", "KB", "MB", "GB"];
  let v = value;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  const fixed = i === 0 ? String(Math.round(v)) : v.toFixed(1);
  return `${fixed} ${units[i]}`;
}

export default function DashboardConversationPage() {
  const router = useRouter();
  const conversationIdRaw = router.query.conversationId;
  const conversationId = typeof conversationIdRaw === "string" ? conversationIdRaw : null;

  const { user, loading: authLoading, profileLoading, refreshMessageCount } = useAuth();

  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  const [ctxLoading, setCtxLoading] = useState(true);
  const [title, setTitle] = useState("Unterhaltung");
  const [context, setContext] = useState<Awaited<ReturnType<typeof getConversationContext>>>(null);

  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputId = "message-attachments-input";

  const isAuthed = !!user && !authLoading && !profileLoading;

  const readOnly = !!context?.flags?.read_only;

  const canSend = useMemo(() => {
    const hasText = draft.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;
    return isAuthed && !!conversationId && (hasText || hasFiles) && !busy && !readOnly;
  }, [busy, conversationId, draft, isAuthed, readOnly, selectedFiles.length]);

  useEffect(() => {
    if (!authLoading && !profileLoading && !user) {
      router.push("/auth?redirect=" + encodeURIComponent(router.asPath));
    }
  }, [authLoading, profileLoading, router, user]);

  useEffect(() => {
    if (!conversationId) return;

    let cancelled = false;

    async function loadContext() {
      setCtxLoading(true);
      const ctx = await getConversationContext(conversationId);
      if (cancelled) return;

      if (!ctx) {
        toast.error("Unterhaltung nicht gefunden oder kein Zugriff.");
        router.push("/dashboard/messages");
        return;
      }

      setContext(ctx);
      setTitle(ctx.title || "Unterhaltung");
      setCtxLoading(false);

      await markConversationRead(conversationId);
      await refreshMessageCount();
    }

    loadContext();

    return () => {
      cancelled = true;
    };
  }, [conversationId, refreshMessageCount, router]);

  useEffect(() => {
    if (!conversationId) return;

    let cancelled = false;

    async function loadMessages() {
      setLoadingMessages(true);
      const data = await getMessages(conversationId);
      if (cancelled) return;

      setMessages(
        data.map((m) => ({
          id: m.id,
          sender_user_id: m.sender_user_id,
          body: m.body,
          created_at: m.created_at,
          attachments: Array.isArray(m.message_attachments)
            ? m.message_attachments.map((a) => ({
                id: a.id,
                storage_path: a.storage_path,
                file_name: a.file_name,
                mime_type: a.mime_type,
                size_bytes: a.size_bytes,
                created_at: a.created_at,
              }))
            : [],
        }))
      );
      setLoadingMessages(false);
    }

    loadMessages();

    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  async function handleOpenAttachment(att: UiAttachment) {
    const url = await createSignedAttachmentUrl(att.storage_path, { expiresInSeconds: 90 });
    if (!url) {
      toast.error("Download-Link konnte nicht erstellt werden.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleFilesPicked(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files);
    if (next.length === 0) return;

    setSelectedFiles((prev) => {
      const merged = [...prev, ...next].slice(0, 5);
      return merged;
    });
  }

  function removeSelectedFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSend() {
    if (!conversationId) return;
    if (readOnly) return;

    const body = draft.trim();
    const hasFiles = selectedFiles.length > 0;

    setBusy(true);

    const ok = hasFiles
      ? await sendMessageWithAttachments({ conversationId, body, files: selectedFiles })
      : await sendMessage(conversationId, body);

    if (!ok) {
      toast.error(readOnly ? "Nachrichten sind in diesem Chat nicht möglich." : "Nachricht konnte nicht gesendet werden.");
      setBusy(false);
      return;
    }

    setDraft("");
    setSelectedFiles([]);

    const data = await getMessages(conversationId);
    setMessages(
      data.map((m) => ({
        id: m.id,
        sender_user_id: m.sender_user_id,
        body: m.body,
        created_at: m.created_at,
        attachments: Array.isArray(m.message_attachments)
          ? m.message_attachments.map((a) => ({
              id: a.id,
              storage_path: a.storage_path,
              file_name: a.file_name,
              mime_type: a.mime_type,
              size_bytes: a.size_bytes,
              created_at: a.created_at,
            }))
          : [],
      }))
    );

    const nextCtx = await getConversationContext(conversationId);
    if (nextCtx) {
      setContext(nextCtx);
      setTitle(nextCtx.title || title);
    }

    await markConversationRead(conversationId);
    await refreshMessageCount();

    setBusy(false);
  }

  const listing = context?.listing ?? null;
  const buyer = context?.buyer ?? null;

  const counterpartyName =
    context?.counterparty?.display_name ||
    "—";

  const counterpartyLabel =
    context?.counterparty?.role === "seller"
      ? "Anbieter"
      : context?.counterparty?.role === "buyer"
        ? "Interessent"
        : "Kontakt";

  const showSoldNotice = listing?.status === "sold" && context?.conversation.status !== "buyer_selected";

  const canSelectBuyer = !!context?.permissions?.can_select_buyer;
  const canArchive = !!context?.permissions?.can_archive;

  async function handleArchive() {
    if (!conversationId) return;
    setBusy(true);
    const ok = await archiveConversation(conversationId);
    setBusy(false);

    if (!ok) {
      toast.error("Chat konnte nicht archiviert werden.");
      return;
    }

    toast.success("Chat archiviert.");
    const nextCtx = await getConversationContext(conversationId);
    if (nextCtx) setContext(nextCtx);
    await refreshMessageCount();
  }

  async function handleSelectBuyer() {
    if (!conversationId) return;
    setBusy(true);
    const ok = await selectBuyerAndMarkListingSold(conversationId);
    setBusy(false);

    if (!ok) {
      toast.error("Käufer konnte nicht ausgewählt werden.");
      return;
    }

    toast.success("Käufer ausgewählt. Fahrzeug wurde als verkauft markiert.");
    const nextCtx = await getConversationContext(conversationId);
    if (nextCtx) setContext(nextCtx);
    await refreshMessageCount();
  }

  return (
    <>
      <Head>
        <title>{title} - BuyAuto</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <DashboardLayout hideSidebar leftRail={<MessageCenterRail />}>
        <Card className="rounded-3xl border border-neutral-200/60 bg-white shadow-sm">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col gap-5">
              <div className="flex items-center">
                <Button asChild variant="ghost" className="rounded-2xl px-2 -ml-2 text-neutral-700 hover:bg-neutral-100">
                  <Link href="/dashboard">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Zurück zum Dashboard
                  </Link>
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 truncate">
                    {ctxLoading ? "Unterhaltung" : title}
                  </h1>
                  <p className="mt-1 text-sm text-neutral-600">Verlauf und Antworten</p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {context?.conversation.status === "archived" ? <Badge variant="secondary">Archiviert</Badge> : null}
                    {context?.conversation.status === "buyer_selected" ? <Badge variant="secondary">Käufer ausgewählt</Badge> : null}
                    {listing?.status === "sold" ? <Badge variant="secondary">Verkauft</Badge> : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {canArchive && context?.conversation.status !== "archived" && context?.conversation.status !== "buyer_selected" ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="rounded-2xl" disabled={busy}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archivieren
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-3xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Chat archivieren?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Archivierte Chats sind im MVP nur lesbar und können nicht reaktiviert werden.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction onClick={handleArchive}>Archivieren</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : null}

                  {canSelectBuyer && listing?.status !== "sold" ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white" disabled={busy}>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Als Käufer auswählen
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-3xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Käufer auswählen und Fahrzeug als verkauft markieren?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Wenn Du diesen Nutzer als Käufer auswählst, wird das Fahrzeug als verkauft markiert. Alle anderen Chats zu diesem Fahrzeug werden automatisch archiviert und können nicht mehr reaktiviert werden. Archivierte Chats bleiben noch 30 Tage lang lesbar und werden danach dauerhaft gelöscht. Weitere neue Nachrichten von anderen Interessenten sind nicht mehr möglich.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                          <AlertDialogAction onClick={handleSelectBuyer}>Käufer auswählen</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : null}
                </div>
              </div>

              {ctxLoading ? (
                <div className="rounded-3xl border border-neutral-200/60 bg-neutral-50 p-4 sm:p-5 animate-pulse">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="h-28 w-full sm:w-44 rounded-2xl bg-neutral-200" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-4 w-40 rounded bg-neutral-200" />
                      <div className="h-4 w-32 rounded bg-neutral-200" />
                      <div className="h-4 w-36 rounded bg-neutral-200" />
                    </div>
                  </div>
                </div>
              ) : listing ? (
                <Link
                  href={buildListingHref({ id: listing.id, brand: listing.brand, model: listing.model })}
                  className="block rounded-3xl border border-neutral-200/60 bg-neutral-50 p-4 sm:p-5 transition hover:bg-neutral-100/60 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20"
                  aria-label="Zum Inserat"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative h-28 w-full sm:w-44 overflow-hidden rounded-2xl bg-white border border-neutral-200/60">
                      {listing.cover_image_url ? (
                        <Image
                          src={listing.cover_image_url}
                          alt={listing.make_model}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 176px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-neutral-400">
                          Foto
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-neutral-900">{listing.make_model}</div>
                      <div className="mt-1 text-sm text-neutral-600">
                        {listing.year ? `Jahr ${listing.year}` : null}
                        {listing.year && listing.mileage_km ? " · " : null}
                        {listing.mileage_km ? `${formatChf(listing.mileage_km)} km` : null}
                      </div>

                      <div className="mt-2 text-sm text-neutral-700">
                        {listing.price_per_month_chf ? (
                          <span>{formatChf(listing.price_per_month_chf)} CHF / Monat</span>
                        ) : listing.purchase_price_chf ? (
                          <span>{formatChf(listing.purchase_price_chf)} CHF Kaufpreis</span>
                        ) : (
                          <span className="text-neutral-500">Preis nicht verfügbar</span>
                        )}
                      </div>

                      {counterpartyName && counterpartyName !== "—" ? (
                        <div className="mt-3 text-sm">
                          <div className="text-neutral-900 font-semibold">{counterpartyLabel}</div>
                          <div className="text-neutral-600">{counterpartyName}</div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {showSoldNotice ? (
                    <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
                      Das Fahrzeug wurde verkauft, weitere Nachrichten sind nicht möglich.
                    </div>
                  ) : null}

                  {context?.conversation.status === "archived" ? (
                    <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
                      Dieser Chat ist archiviert und nur noch lesbar.
                    </div>
                  ) : null}
                </Link>
              ) : null}

              <div className="rounded-2xl border border-neutral-200/60 bg-neutral-50 overflow-hidden">
                <div className="max-h-[55vh] overflow-y-auto p-4 space-y-3">
                  {loadingMessages ? (
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
                              isMe ? "bg-neutral-900 text-white border-neutral-900" : "bg-white text-neutral-900 border-neutral-200"
                            )}
                          >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.body}</p>

                            {m.attachments.length > 0 ? (
                              <div className="mt-3 space-y-2">
                                {m.attachments.map((a) => (
                                  <button
                                    key={a.id}
                                    type="button"
                                    onClick={() => handleOpenAttachment(a)}
                                    className={cn(
                                      "w-full text-left rounded-xl border px-3 py-2 text-sm transition",
                                      isMe
                                        ? "border-white/20 bg-white/10 hover:bg-white/15"
                                        : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100"
                                    )}
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className={cn("truncate font-semibold", isMe ? "text-white" : "text-neutral-900")}>
                                          {a.file_name}
                                        </div>
                                        <div className={cn("text-[11px] mt-0.5", isMe ? "text-white/70" : "text-neutral-500")}>
                                          {a.mime_type || "Datei"}{a.size_bytes ? ` · ${formatBytes(a.size_bytes)}` : ""}
                                        </div>
                                      </div>
                                      <div className={cn("text-[11px] font-semibold", isMe ? "text-white/80" : "text-neutral-600")}>
                                        Öffnen
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            ) : null}

                            <p className={cn("text-[11px] mt-2", isMe ? "text-white/70" : "text-neutral-500")}>
                              {formatTimeCH(m.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="border-t border-neutral-200/60 bg-white p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <input
                      id={fileInputId}
                      type="file"
                      className="hidden"
                      multiple
                      onChange={(e) => handleFilesPicked(e.target.files)}
                      disabled={!isAuthed || readOnly}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl"
                      disabled={!isAuthed || readOnly || busy}
                      onClick={() => document.getElementById(fileInputId)?.click()}
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      Datei anhängen
                    </Button>

                    {selectedFiles.length > 0 ? (
                      <div className="text-xs text-neutral-600">
                        {selectedFiles.length} Datei{selectedFiles.length === 1 ? "" : "en"}
                      </div>
                    ) : null}
                  </div>

                  {selectedFiles.length > 0 ? (
                    <div className="mb-3 space-y-2">
                      {selectedFiles.map((f, idx) => (
                        <div key={`${f.name}-${idx}`} className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-3 py-2">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-neutral-900">{f.name}</div>
                            <div className="text-[11px] text-neutral-500">{formatBytes(f.size)}</div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            className="rounded-xl px-2 text-neutral-600 hover:bg-neutral-100"
                            onClick={() => removeSelectedFile(idx)}
                            disabled={busy}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Nachricht schreiben…"
                    className="min-h-[92px] rounded-2xl border-neutral-200 focus:border-neutral-400"
                    disabled={!isAuthed || readOnly}
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
    const redirectUrl = encodeURIComponent(ctx.resolvedUrl);
    return {
      redirect: {
        destination: `/auth?redirect=${redirectUrl}`,
        permanent: false,
      },
    };
  }

  return { props: {} };
};