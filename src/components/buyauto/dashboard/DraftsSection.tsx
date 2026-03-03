import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { deleteListingDraft, getMyListingDrafts, type ListingDraft } from "@/services/listingDraftService";
import StatusBadge from "./StatusBadge";
import { supabase } from "@/integrations/supabase/client";

const buildDraftTitle = (draft: ListingDraft) => {
  const brand = typeof draft.data.brand === "string" ? draft.data.brand.trim() : "";
  const model = typeof draft.data.model === "string" ? draft.data.model.trim() : "";
  const year = typeof draft.data.year === "number" ? draft.data.year : undefined;

  const base = [brand, model].filter(Boolean).join(" ");
  if (base && year) return `${base} (${year})`;
  if (base) return base;
  return "Entwurf";
};

export default function DraftsSection() {
  const router = useRouter();
  const { user } = useAuth();

  const [drafts, setDrafts] = useState<ListingDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadDrafts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getMyListingDrafts({ user });

      const listingIds = data
        .map((d) => (d?.data as any)?.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0);

      if (listingIds.length > 0) {
        const { data: listings, error } = await supabase
          .from("listings")
          .select("id, status")
          .in("id", listingIds);

        if (error) {
          console.warn("Could not verify listing status for drafts:", error);
          setDrafts(data);
          return;
        }

        const publishedIds = new Set(
          (listings ?? [])
            .filter((l) =>
              l?.status === "published" ||
              l?.status === "active" ||
              l?.status === "pending" ||
              l?.status === "sold" ||
              l?.status === "expired" ||
              l?.status === "archived"
            )
            .map((l) => l.id)
        );

        const staleDrafts = data.filter((d) => {
          const id = (d?.data as any)?.id;
          return typeof id === "string" && publishedIds.has(id);
        });

        if (staleDrafts.length > 0) {
          void Promise.allSettled(
            staleDrafts.map((d) => deleteListingDraft({ user, draftId: d.id }))
          ).then(() => {
            setDrafts(data.filter((d) => {
              const id = (d?.data as any)?.id;
              return !(typeof id === "string" && publishedIds.has(id));
            }));
          });
          return;
        }
      }

      setDrafts(data);
    } catch (e) {
      console.error("Failed to load listing drafts:", e);
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void loadDrafts();
  }, [loadDrafts, user]);

  const onResume = useCallback(
    (draftId: string) => {
      router.push(`/inserat-erstellen?draft=${draftId}`);
    },
    [router]
  );

  const onConfirmDelete = useCallback(async () => {
    if (!user || !draftToDelete) return;

    setActionLoading(draftToDelete);
    try {
      await deleteListingDraft({ user, draftId: draftToDelete });
      setDrafts((prev) => prev.filter((d) => d.id !== draftToDelete));
      setDeleteDialogOpen(false);
      setDraftToDelete(null);
    } catch (e) {
      console.error("Failed to delete listing draft:", e);
      alert("Fehler beim Löschen des Entwurfs.");
    } finally {
      setActionLoading(null);
    }
  }, [draftToDelete, user]);

  if (!user) return null;

  if (loading && drafts.length === 0) {
    return (
      <div className="mb-8">
        <div className="h-6 w-40 bg-neutral-200 rounded animate-pulse mb-4" />
        <div className="grid gap-4">
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 w-64 bg-neutral-200 rounded mb-3" />
              <div className="h-4 w-32 bg-neutral-200 rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (drafts.length === 0) return null;

  return (
    <div className="mb-8 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-neutral-900">Entwürfe</h3>
        <span className="text-sm text-neutral-600">
          {drafts.length} {drafts.length === 1 ? "Entwurf" : "Entwürfe"}
        </span>
      </div>

      <div className="grid gap-4">
        {drafts.map((draft) => {
          const title = buildDraftTitle(draft);

          return (
            <Card key={draft.id} className="border-neutral-200/60">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h4 className="text-base font-semibold text-neutral-900 truncate">{title}</h4>
                      <StatusBadge status="draft" />
                    </div>
                    <p className="text-sm text-neutral-600">
                      Speichere den Entwurf, um später weiterzumachen.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => onResume(draft.id)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Bearbeiten
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => onResume(draft.id)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Fortsetzen
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            setDraftToDelete(draft.id);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Entwurf löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du diesen Entwurf wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={actionLoading === draftToDelete}
            >
              {actionLoading === draftToDelete ? "Wird gelöscht..." : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}