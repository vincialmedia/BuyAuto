import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  createOrGetConversationForListing,
  getExistingConversationForListing,
  createSignedAttachmentUrl,
  getConversationContext,
  getMessages,
  sendMessage,
  sendMessageWithAttachments,
} from "@/services/messagingService";
import { LogIn, SendHorizontal, Paperclip, X } from "lucide-react";
import { useRouter } from "next/router";

export interface MessagingPanelProps {
  listingId: string;
  listingTitle: string;
  ownerId?: string | null;
  isSold?: boolean;
  className?: string;
}

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

type Notice = {
  kind: "info" | "warning";
  text: string;
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

export function MessagingPanel({ listingId, listingTitle, ownerId, isSold, className }: MessagingPanelProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isSeller = Boolean(user?.id && ownerId && user.id === ownerId);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputId = useMemo(() => `message-attachments-${listingId}`, [listingId]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [readOnly, setReadOnly] = useState(false);
  const [soldBlocked, setSoldBlocked] = useState(false);
  const [messagingUnavailable, setMessagingUnavailable] = useState(false);
  const [counterpartyName, setCounterpartyName] = useState<string | null>(null);
  const [counterpartyRole, setCounterpartyRole] = useState<"buyer" | "seller" | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isAuthed = !!user && !loading;

  const canSend = useMemo(() => {
    const hasText = draft.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;
    return isAuthed && !isSeller && (hasText || hasFiles) && !busy && !readOnly && !soldBlocked && !messagingUnavailable;
  }, [busy, draft, isAuthed, isSeller, readOnly, soldBlocked, messagingUnavailable, selectedFiles.length]);

  const counterpartyLabel = useMemo(() => {
    if (counterpartyRole === "seller") return "Anbieter";
    if (counterpartyRole === "buyer") return "Interessent";
    return "Kontakt";
  }, [counterpartyRole]);

  const notice: Notice | null = useMemo(() => {
    if (isSeller) {
      return { kind: "info", text: "Dies ist dein eigenes Inserat. Du kannst dir selbst keine Nachrichten senden." };
    }
    if (!isAuthed) {
      return { kind: "info", text: "Bitte logge Dich ein oder registriere Dich, um Nachrichten zu schicken." };
    }
    if (soldBlocked) {
      return { kind: "warning", text: "Das Fahrzeug wurde verkauft, weitere Nachrichten sind nicht möglich." };
    }
    if (readOnly) {
      return { kind: "info", text: "Dieser Chat ist archiviert. Weitere Nachrichten sind nicht möglich." };
    }
    if (messagingUnavailable) {
      return { kind: "info", text: "Nachrichten sind momentan nicht verfügbar." };
    }
    return null;
  }, [isAuthed, isSeller, messagingUnavailable, readOnly, soldBlocked]);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!isAuthed) {
        setConversationId(null);
        setMessages([]);
        setInitialLoading(false);
        setReadOnly(false);
        setSoldBlocked(false);
        setMessagingUnavailable(false);
        return;
      }

      if (isSeller) {
        setConversationId(null);
        setMessages([]);
        setInitialLoading(false);
        setReadOnly(true);
        setSoldBlocked(false);
        setMessagingUnavailable(true);
        return;
      }

      setInitialLoading(true);
      setMessagingUnavailable(false);
      setReadOnly(false);
      setSoldBlocked(isSold ?? false);

      const convId = await getExistingConversationForListing(listingId);
      if (cancelled) return;

      setConversationId(convId);

      if (!convId) {
        setMessages([]);
        setInitialLoading(false);
        // Don't block UI here - let them type and send to trigger creation
        return;
      }

      const ctx = await getConversationContext(convId);
      if (cancelled) return;

      const isReadOnly = !!ctx?.flags?.read_only;
      setReadOnly(isReadOnly);

      setCounterpartyName(
        ctx?.counterparty?.display_name || ctx?.seller?.display_name || null
      );
      setCounterpartyRole(
        ctx?.counterparty?.role === "buyer" || ctx?.counterparty?.role === "seller"
          ? ctx.counterparty.role
          : null
      );

      const listingIsSold = ctx?.listing?.status === "sold";
      const buyerSelected = ctx?.conversation?.status === "buyer_selected";

      setSoldBlocked(listingIsSold && !buyerSelected);

      const data = await getMessages(convId);
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
      setInitialLoading(false);
    }

    boot();

    return () => {
      cancelled = true;
    };
  }, [isAuthed, listingId, isSeller, isSold]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  async function handleOpenAttachment(att: UiAttachment) {
    const url = await createSignedAttachmentUrl(att.storage_path, { expiresInSeconds: 90 });
    if (!url) return;
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
    if (readOnly || soldBlocked || messagingUnavailable || isSeller) return;

    const body = draft.trim();
    const hasFiles = selectedFiles.length > 0;
    if (!body && !hasFiles) return;

    setBusy(true);

    let targetConvId = conversationId;

    if (!targetConvId) {
      targetConvId = await createOrGetConversationForListing(listingId);
      if (!targetConvId) {
        setBusy(false);
        return;
      }
      setConversationId(targetConvId);
    }

    const ok = hasFiles
      ? await sendMessageWithAttachments({ conversationId: targetConvId, body, files: selectedFiles })
      : await sendMessage(targetConvId, body);

    if (ok) {
      setDraft("");
      setSelectedFiles([]);

      const data = await getMessages(targetConvId);
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

      const ctx = await getConversationContext(targetConvId);
      setReadOnly(!!ctx?.flags?.read_only);

      setCounterpartyName(
        ctx?.counterparty?.display_name || ctx?.seller?.display_name || counterpartyName
      );
      setCounterpartyRole(
        ctx?.counterparty?.role === "buyer" || ctx?.counterparty?.role === "seller"
          ? ctx.counterparty.role
          : counterpartyRole
      );

      const listingIsSold = ctx?.listing?.status === "sold";
      const buyerSelected = ctx?.conversation?.status === "buyer_selected";
      setSoldBlocked(listingIsSold && !buyerSelected);
    }

    setBusy(false);
  }

  return (
    <Card className={cn("border-neutral-200/60 shadow-sm bg-white rounded-3xl overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold tracking-tight text-neutral-900">Nachricht Schreiben</h3>
            <p className="text-sm text-neutral-600 mt-1">Chat-Verlauf bleibt beim Inserat „{listingTitle}“ gespeichert.</p>
            {counterpartyName ? (
              <p className="text-sm text-neutral-600 mt-1">
                <span className="font-semibold text-neutral-900">{counterpartyLabel}:</span> {counterpartyName}
              </p>
            ) : null}
          </div>

          {!isAuthed ? (
            <Button
              className="bg-neutral-900 hover:bg-neutral-800 text-white"
              onClick={() => router.push("/auth?redirect=" + encodeURIComponent(router.asPath))}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Einloggen
            </Button>
          ) : null}
        </div>

        {notice ? (
          <div
            className={cn(
              "mt-4 rounded-2xl border p-4 text-sm",
              notice.kind === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-neutral-200 bg-neutral-50 text-neutral-700"
            )}
          >
            {notice.text}
          </div>
        ) : null}

        <div className="mt-5 rounded-2xl border border-neutral-200/60 bg-neutral-50 overflow-hidden">
          <div ref={scrollRef} className="max-h-72 overflow-y-auto p-4 space-y-3">
            {initialLoading ? (
              <div className="space-y-2">
                <div className="h-10 bg-white rounded-xl border border-neutral-200 animate-pulse" />
                <div className="h-10 bg-white rounded-xl border border-neutral-200 animate-pulse" />
                <div className="h-10 bg-white rounded-xl border border-neutral-200 animate-pulse" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-sm text-neutral-600">Noch keine Nachrichten. Starte die Unterhaltung.</div>
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
                        {formatTime(m.created_at)}
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
                disabled={!isAuthed || isSeller || readOnly || soldBlocked || messagingUnavailable}
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                disabled={!isAuthed || isSeller || readOnly || soldBlocked || messagingUnavailable || busy}
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
              disabled={!isAuthed || isSeller || readOnly || soldBlocked || messagingUnavailable}
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