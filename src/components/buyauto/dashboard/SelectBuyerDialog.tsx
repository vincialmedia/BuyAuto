import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, MessageSquare, UserRound } from "lucide-react";
import {
  getListingConversationsForSeller,
  type ListingConversationItem,
} from "@/services/messagingService";

export interface SelectBuyerDialogProps {
  open: boolean;
  listingId: string | null;
  listingLabel: string;
  onOpenChange: (open: boolean) => void;
  /** Seller picked a chat: mark sold via buyer selection. */
  onConfirmBuyer: (conversationId: string) => Promise<void>;
  /** No buyer on BuyAuto (sold elsewhere): plain mark-as-sold. */
  onConfirmWithoutBuyer: () => Promise<void>;
  busy: boolean;
}

function formatTimeCH(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("de-CH", {
    timeZone: "Europe/Zurich",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(date);
}

/**
 * Marking a listing as sold from the overview: the seller first says who
 * bought the car, picked from the chats on that listing. The chosen chat
 * stays open for buyer + seller, everything else is archived — same rules as
 * "Als Käufer auswählen" inside a conversation.
 */
export default function SelectBuyerDialog({
  open,
  listingId,
  listingLabel,
  onOpenChange,
  onConfirmBuyer,
  onConfirmWithoutBuyer,
  busy,
}: SelectBuyerDialogProps) {
  const [conversations, setConversations] = useState<ListingConversationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [noBuyerSelected, setNoBuyerSelected] = useState(false);

  useEffect(() => {
    if (!open || !listingId) return;

    let cancelled = false;
    setLoading(true);
    setConversations([]);
    setSelectedConversationId(null);
    setNoBuyerSelected(false);

    (async () => {
      const rows = await getListingConversationsForSeller(listingId);
      if (cancelled) return;
      setConversations(rows);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, listingId]);

  const handleConfirm = useCallback(async () => {
    if (noBuyerSelected) {
      await onConfirmWithoutBuyer();
      return;
    }
    if (selectedConversationId) {
      await onConfirmBuyer(selectedConversationId);
    }
  }, [noBuyerSelected, onConfirmBuyer, onConfirmWithoutBuyer, selectedConversationId]);

  const canConfirm = !busy && !loading && (noBuyerSelected || !!selectedConversationId);
  const hasConversations = conversations.length > 0;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next); }}>
      <DialogContent className="rounded-3xl w-[calc(100vw-2rem)] max-w-lg max-h-[85vh] overflow-y-auto overflow-x-hidden break-words p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle>Als verkauft markieren</DialogTitle>
          <DialogDescription>
            Wer hat {listingLabel ? <span className="font-semibold text-neutral-900">{listingLabel}</span> : "das Fahrzeug"} gekauft?
            Wähle die Käuferin oder den Käufer aus deinen Chats. Der gewählte Chat bleibt für euch beide offen,
            alle anderen Chats zu diesem Inserat werden archiviert.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {loading ? (
            <div className="space-y-2">
              <div className="h-14 rounded-2xl border border-neutral-200 bg-neutral-50 animate-pulse" />
              <div className="h-14 rounded-2xl border border-neutral-200 bg-neutral-50 animate-pulse" />
            </div>
          ) : hasConversations ? (
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {conversations.map((c) => {
                const isSelected = !noBuyerSelected && selectedConversationId === c.conversationId;
                return (
                  <button
                    key={c.conversationId}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setNoBuyerSelected(false);
                      setSelectedConversationId(c.conversationId);
                    }}
                    className={cn(
                      "w-full text-left rounded-2xl border px-4 py-3 transition",
                      isSelected
                        ? "border-neutral-900 bg-neutral-900/5 ring-1 ring-neutral-900"
                        : "border-neutral-200 bg-white hover:bg-neutral-50"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center">
                          <UserRound className="h-4 w-4 text-neutral-500" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-neutral-900">{c.buyerName}</span>
                            {c.conversationStatus === "archived" ? (
                              <Badge variant="outline" className="text-[10px]">Archiviert</Badge>
                            ) : null}
                          </div>
                          {c.lastMessagePreview ? (
                            <div className="truncate text-xs text-neutral-500 mt-0.5">{c.lastMessagePreview}</div>
                          ) : null}
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-[11px] text-neutral-500">{formatTimeCH(c.lastMessageAt)}</span>
                        {isSelected ? <CheckCircle2 className="h-5 w-5 text-neutral-900" /> : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm text-neutral-600 flex items-start gap-3">
              <MessageSquare className="h-4 w-4 mt-0.5 shrink-0 text-neutral-400" />
              <span>Zu diesem Inserat gibt es noch keine Chats. Du kannst das Inserat trotzdem als verkauft markieren.</span>
            </div>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setNoBuyerSelected(true);
              setSelectedConversationId(null);
            }}
            className={cn(
              "w-full text-left rounded-2xl border px-4 py-3 transition",
              noBuyerSelected
                ? "border-neutral-900 bg-neutral-900/5 ring-1 ring-neutral-900"
                : "border-dashed border-neutral-300 bg-white hover:bg-neutral-50"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-neutral-900">Käufer ist nicht auf BuyAuto</div>
                <div className="text-xs text-neutral-500 mt-0.5">
                  Das Fahrzeug wurde ausserhalb der Plattform verkauft. Alle Chats werden schreibgeschützt.
                </div>
              </div>
              {noBuyerSelected ? <CheckCircle2 className="h-5 w-5 shrink-0 text-neutral-900" /> : null}
            </div>
          </button>
        </div>

        <DialogFooter className="mt-2 flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            className="rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {busy ? "Wird markiert…" : "Als verkauft markieren"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
