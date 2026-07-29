import { useEffect, useMemo, useState } from "react";
import { adminService, type AdminDraft } from "@/services/adminService";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Archive, Clock, ExternalLink, Mail, RefreshCw, Search } from "lucide-react";
import {
  DRAFT_ARCHIVE_AFTER_DAYS,
  DRAFT_DELETE_AFTER_ARCHIVE_DAYS,
  describeDraftLifecycle,
  formatDateDeCh,
  getDraftLifecycle,
} from "@/lib/buyauto/draftLifecycle";

type StatusFilter = "all" | "active" | "archived";

const draftTitle = (draft: AdminDraft) => {
  const base = [draft.brand, draft.model].filter(Boolean).join(" ").trim();
  if (base && draft.year) return `${base} (${draft.year})`;
  if (base) return base;
  return "Entwurf ohne Fahrzeug";
};

export function DraftsView() {
  const [drafts, setDrafts] = useState<AdminDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const { toast } = useToast();

  const loadDrafts = async () => {
    try {
      setLoading(true);
      setDrafts(await adminService.getDrafts());
    } catch (error) {
      console.error("Error loading drafts:", error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Entwürfe konnten nicht geladen werden.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return drafts.filter((draft) => {
      if (statusFilter === "active" && draft.archived_at) return false;
      if (statusFilter === "archived" && !draft.archived_at) return false;
      if (!term) return true;

      const haystack = [
        draft.brand,
        draft.model,
        draft.owner_profile?.full_name,
        draft.owner_profile?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [drafts, search, statusFilter]);

  const archivedCount = drafts.filter((d) => d.archived_at).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">Entwürfe</h2>
        <p className="text-sm text-neutral-600 mt-1">
          Alle unfertigen Entwürfe aller Nutzer. Nach {DRAFT_ARCHIVE_AFTER_DAYS} Tagen ohne Bearbeitung werden sie
          archiviert und {DRAFT_DELETE_AFTER_ARCHIVE_DAYS} Tage später endgültig gelöscht.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        <Card className="p-4 bg-neutral-50 border-neutral-200">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-neutral-600" />
            <div>
              <p className="text-sm text-neutral-600">Gesamt</p>
              <p className="text-2xl font-semibold text-neutral-900">{drafts.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-emerald-600" />
            <div>
              <p className="text-sm text-neutral-600">Aktiv</p>
              <p className="text-2xl font-semibold text-neutral-900">{drafts.length - archivedCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center gap-3">
            <Archive className="w-5 h-5 text-amber-600" />
            <div>
              <p className="text-sm text-neutral-600">Archiviert</p>
              <p className="text-2xl font-semibold text-neutral-900">{archivedCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <Input
              placeholder="Marke, Modell, Name oder E-Mail…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="active">Aktiv</SelectItem>
              <SelectItem value="archived">Archiviert</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadDrafts} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Aktualisieren
          </Button>
        </div>
      </Card>

      {loading ? (
        <Card className="p-8 text-center text-neutral-600">Entwürfe werden geladen…</Card>
      ) : visible.length === 0 ? (
        <Card className="p-8 text-center text-neutral-600">Keine Entwürfe gefunden.</Card>
      ) : (
        <>
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fahrzeug</TableHead>
                    <TableHead>Besitzer</TableHead>
                    <TableHead>Zuletzt bearbeitet</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ablauf</TableHead>
                    <TableHead className="text-right">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((draft) => {
                    const lifecycle = getDraftLifecycle(draft);
                    return (
                      <TableRow key={`${draft.source}-${draft.id}`} className="hover:bg-neutral-50">
                        <TableCell>
                          <p className="font-medium text-neutral-900">{draftTitle(draft)}</p>
                          <p className="text-xs text-neutral-500">
                            {draft.source === "wizard" ? "Assistent-Entwurf" : "Inserat-Entwurf"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-neutral-900">
                            {draft.owner_profile?.full_name || "Kein Name"}
                          </p>
                          {draft.owner_profile?.email && (
                            <a
                              href={`mailto:${draft.owner_profile.email}`}
                              className="text-xs text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-1"
                            >
                              <Mail className="w-3 h-3" />
                              {draft.owner_profile.email}
                            </a>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-neutral-600">
                          {formatDateDeCh(draft.updated_at)}
                        </TableCell>
                        <TableCell>
                          {lifecycle.archived ? (
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Archiviert</Badge>
                          ) : (
                            <Badge variant="secondary">Entwurf</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-neutral-900">{describeDraftLifecycle(lifecycle)}</p>
                          <p className="text-xs text-neutral-500">
                            {formatDateDeCh(lifecycle.deleteDueAt ?? lifecycle.archiveDueAt)}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <a href={draft.resume_url} target="_blank" rel="noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Öffnen
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>

          <div className="md:hidden space-y-3">
            {visible.map((draft) => {
              const lifecycle = getDraftLifecycle(draft);
              return (
                <Card key={`${draft.source}-${draft.id}`} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900 truncate">{draftTitle(draft)}</p>
                      <p className="text-xs text-neutral-500">
                        {draft.owner_profile?.full_name || draft.owner_profile?.email || "Unbekannt"}
                      </p>
                    </div>
                    {lifecycle.archived ? (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 shrink-0">Archiviert</Badge>
                    ) : (
                      <Badge variant="secondary" className="shrink-0">
                        Entwurf
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-neutral-700 mt-3">{describeDraftLifecycle(lifecycle)}</p>
                  <p className="text-xs text-neutral-500">
                    Zuletzt bearbeitet: {formatDateDeCh(draft.updated_at)}
                  </p>
                  <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                    <a href={draft.resume_url} target="_blank" rel="noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Öffnen
                    </a>
                  </Button>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
