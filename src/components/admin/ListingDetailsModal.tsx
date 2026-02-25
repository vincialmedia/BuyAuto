import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminService } from "@/services/adminService";
import type { AdminListing } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import { Save, Edit2, Star, CheckCircle } from "lucide-react";
import { cantons } from "@/lib/buyauto/data";

interface ListingDetailsModalProps {
  listing: AdminListing;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

type ListingStatus = "pending" | "published" | "rejected" | "expired" | "archived" | "active";

function safeNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return null;
  return n;
}

function safeInt(value: string): number | null {
  const n = safeNumber(value);
  if (n === null) return null;
  return Math.trunc(n);
}

function safeString(value: string): string | null {
  const v = value.trim();
  return v.length > 0 ? v : null;
}

function formatDateTime(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("de-CH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatPriceCHF(price: number | null) {
  if (price === null) return "—";
  return new Intl.NumberFormat("de-CH", {
    style: "currency",
    currency: "CHF",
  }).format(price);
}

function getStatusBadge(status: ListingStatus) {
  switch (status) {
    case "pending":
      return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Wartend</Badge>;
    case "published":
      return <Badge variant="default" className="bg-emerald-100 text-emerald-800">Freigegeben</Badge>;
    case "rejected":
      return <Badge variant="destructive">Abgelehnt</Badge>;
    case "expired":
      return <Badge variant="outline">Abgelaufen</Badge>;
    case "archived":
      return <Badge variant="outline" className="bg-neutral-100 text-neutral-700">Archiviert</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function ListingDetailsModal({ listing, open, onOpenChange, onUpdate }: ListingDetailsModalProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editData, setEditData] = useState<Partial<AdminListing>>({});
  const [activeTab, setActiveTab] = useState<"core" | "pricing" | "images" | "meta">("core");

  const imagesCount = useMemo(() => (Array.isArray(listing.images) ? listing.images.length : 0), [listing.images]);

  useEffect(() => {
    if (!open) return;
    setEditing(false);
    setActiveTab("core");
    setEditData({
      brand: listing.brand,
      model: listing.model,
      title: listing.title,
      description: listing.description,
      year: listing.year,
      location: listing.location,
      canton_code: listing.canton_code,
      status: listing.status,
      premium: listing.premium,
      premium_until: listing.premium_until,
      expires_at: listing.expires_at,
      duration_days: listing.duration_days,
      remaining_months: listing.remaining_months,
      remaining_km: listing.remaining_km,
      price_paid_chf: listing.price_paid_chf,
      price_plan: listing.price_plan,
      cover_image_index: listing.cover_image_index,
      cover_image_url: listing.cover_image_url,
    });
  }, [listing, open]);

  const onClose = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setEditing(false);
    }
  };

  const cantonLabel = useMemo(() => {
    const found = cantons.find((c) => c.value === listing.canton_code);
    return found?.label ?? listing.canton_code;
  }, [listing.canton_code]);

  const handleApprove = async () => {
    try {
      await adminService.approveListing(listing.id);
      toast({ title: "Freigegeben", description: "Das Inserat wurde erfolgreich freigegeben." });
      onUpdate();
    } catch (error) {
      console.error("Error approving listing:", error);
      toast({ variant: "destructive", title: "Fehler", description: "Inserat konnte nicht freigegeben werden." });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const sanitized: Partial<AdminListing> = {
        brand: safeString(String(editData.brand ?? "")) ?? listing.brand,
        model: safeString(String(editData.model ?? "")) ?? listing.model,
        title: safeString(String(editData.title ?? "")),
        description: safeString(String(editData.description ?? "")),
        year: typeof editData.year === "number" ? editData.year : listing.year,
        location: safeString(String(editData.location ?? "")) ?? listing.location,
        canton_code: safeString(String(editData.canton_code ?? "")) ?? listing.canton_code,
        status: (editData.status as ListingStatus) ?? listing.status,
        premium: !!editData.premium,
        remaining_months: typeof editData.remaining_months === "number" ? editData.remaining_months : safeInt(String(editData.remaining_months ?? "")),
        remaining_km: typeof editData.remaining_km === "number" ? editData.remaining_km : safeInt(String(editData.remaining_km ?? "")),
        price_paid_chf: typeof editData.price_paid_chf === "number" ? editData.price_paid_chf : safeNumber(String(editData.price_paid_chf ?? "")),
        duration_days: typeof editData.duration_days === "number" ? editData.duration_days : safeInt(String(editData.duration_days ?? "")),
        expires_at: safeString(String(editData.expires_at ?? "")),
        premium_until: safeString(String(editData.premium_until ?? "")),
        price_plan: safeString(String(editData.price_plan ?? "")) ?? listing.price_plan,
        cover_image_index: typeof editData.cover_image_index === "number" ? editData.cover_image_index : safeInt(String(editData.cover_image_index ?? "")) ?? listing.cover_image_index,
        cover_image_url: safeString(String(editData.cover_image_url ?? "")),
      };

      await adminService.updateListingDetails(listing.id, sanitized);

      toast({ title: "Gespeichert", description: "Inserat wurde erfolgreich aktualisiert." });
      setEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating listing:", error);
      toast({ variant: "destructive", title: "Fehler", description: "Inserat konnte nicht aktualisiert werden." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <DialogTitle className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{listing.brand} {listing.model} ({listing.year})</span>
                {listing.premium && <Star className="w-5 h-5 text-amber-500" />}
                {getStatusBadge(listing.status as ListingStatus)}
              </DialogTitle>
              <div className="text-sm text-neutral-600">
                Uploader: <span className="font-medium text-neutral-900">{listing.owner_profile?.email ?? "—"}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {listing.status === "pending" && !editing && (
                <Button onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Freigeben
                </Button>
              )}

              {!editing ? (
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Bearbeiten
                </Button>
              ) : (
                <>
                  <Button variant="outline" disabled={saving} onClick={() => setEditing(false)}>
                    Abbrechen
                  </Button>
                  <Button disabled={saving} onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Speichern..." : "Speichern"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
            <TabsTrigger value="core">Kern</TabsTrigger>
            <TabsTrigger value="pricing">Preis & Laufzeit</TabsTrigger>
            <TabsTrigger value="images">Bilder</TabsTrigger>
            <TabsTrigger value="meta">Meta</TabsTrigger>
          </TabsList>

          <TabsContent value="core" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-4 rounded-2xl border border-neutral-200 p-4">
                <h3 className="font-medium text-neutral-900">Fahrzeug</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm text-neutral-600">Marke</label>
                    {editing ? (
                      <Input value={String(editData.brand ?? "")} onChange={(e) => setEditData((p) => ({ ...p, brand: e.target.value }))} />
                    ) : (
                      <p className="font-medium">{listing.brand}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm text-neutral-600">Modell</label>
                    {editing ? (
                      <Input value={String(editData.model ?? "")} onChange={(e) => setEditData((p) => ({ ...p, model: e.target.value }))} />
                    ) : (
                      <p className="font-medium">{listing.model}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm text-neutral-600">Jahr</label>
                    {editing ? (
                      <Input
                        type="number"
                        value={String(editData.year ?? "")}
                        onChange={(e) => setEditData((p) => ({ ...p, year: safeInt(e.target.value) ?? listing.year }))}
                      />
                    ) : (
                      <p className="font-medium">{listing.year}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm text-neutral-600">Titel</label>
                    {editing ? (
                      <Input value={String(editData.title ?? "")} onChange={(e) => setEditData((p) => ({ ...p, title: e.target.value }))} placeholder="Optional" />
                    ) : (
                      <p className="font-medium">{listing.title || <span className="text-neutral-400">—</span>}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-neutral-600">Beschreibung</label>
                  {editing ? (
                    <Textarea
                      value={String(editData.description ?? "")}
                      onChange={(e) => setEditData((p) => ({ ...p, description: e.target.value }))}
                      className="min-h-[120px]"
                      placeholder="Fahrzeugbeschreibung..."
                    />
                  ) : (
                    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm whitespace-pre-wrap">
                      {listing.description || <span className="text-neutral-400 italic">Keine Beschreibung vorhanden</span>}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-neutral-200 p-4">
                <h3 className="font-medium text-neutral-900">Standort & Status</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm text-neutral-600">Ort</label>
                    {editing ? (
                      <Input value={String(editData.location ?? "")} onChange={(e) => setEditData((p) => ({ ...p, location: e.target.value }))} />
                    ) : (
                      <p className="font-medium">{listing.location}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm text-neutral-600">Kanton</label>
                    {editing ? (
                      <Select value={String(editData.canton_code ?? "")} onValueChange={(value) => setEditData((p) => ({ ...p, canton_code: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Wählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          {cantons.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="font-medium">{cantonLabel}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm text-neutral-600">Status</label>
                    {editing ? (
                      <Select value={String(editData.status ?? listing.status)} onValueChange={(value) => setEditData((p) => ({ ...p, status: value as ListingStatus }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Wartend</SelectItem>
                          <SelectItem value="published">Freigegeben</SelectItem>
                          <SelectItem value="rejected">Abgelehnt</SelectItem>
                          <SelectItem value="expired">Abgelaufen</SelectItem>
                          <SelectItem value="archived">Archiviert</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="pt-1">{getStatusBadge(listing.status as ListingStatus)}</div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm text-neutral-600">Premium</label>
                    {editing ? (
                      <div className="flex items-center gap-2 pt-2">
                        <Checkbox checked={!!editData.premium} onCheckedChange={(checked) => setEditData((p) => ({ ...p, premium: !!checked }))} />
                        <span className="text-sm">Premium Inserat</span>
                      </div>
                    ) : (
                      <p className="font-medium">{listing.premium ? "Ja" : "Nein"}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="rounded-xl border border-neutral-200 p-3">
                    <div className="text-xs text-neutral-600">Erstellt</div>
                    <div className="font-medium text-neutral-900">{formatDateTime(listing.created_at)}</div>
                  </div>
                  <div className="rounded-xl border border-neutral-200 p-3">
                    <div className="text-xs text-neutral-600">Uploader</div>
                    <div className="font-medium text-neutral-900">{listing.owner_profile?.email ?? "—"}</div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pricing" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-4 rounded-2xl border border-neutral-200 p-4">
                <h3 className="font-medium text-neutral-900">Preis</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm text-neutral-600">Listing-Preis (CHF)</label>
                    {editing ? (
                      <Input
                        type="number"
                        value={String(editData.price_paid_chf ?? "")}
                        onChange={(e) => setEditData((p) => ({ ...p, price_paid_chf: safeNumber(e.target.value) }))}
                      />
                    ) : (
                      <p className="font-medium text-emerald-700">{formatPriceCHF(listing.price_paid_chf)}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm text-neutral-600">Plan (raw)</label>
                    {editing ? (
                      <Input value={String(editData.price_plan ?? "")} onChange={(e) => setEditData((p) => ({ ...p, price_plan: e.target.value }))} placeholder="z.B. free / extended / unlimited" />
                    ) : (
                      <p className="font-medium">{listing.price_plan || <span className="text-neutral-400">—</span>}</p>
                    )}
                    <p className="text-xs text-neutral-500">Hinweis: Listing-Typ (Free/Extended/Unlimited) kommt als nächster Schritt (C).</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-neutral-200 p-4">
                <h3 className="font-medium text-neutral-900">Laufzeit</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm text-neutral-600">Dauer (Tage)</label>
                    {editing ? (
                      <Input
                        type="number"
                        value={String(editData.duration_days ?? "")}
                        onChange={(e) => setEditData((p) => ({ ...p, duration_days: safeInt(e.target.value) }))}
                      />
                    ) : (
                      <p className="font-medium">{listing.duration_days ?? <span className="text-neutral-400">—</span>}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm text-neutral-600">Läuft ab (expires_at)</label>
                    {editing ? (
                      <Input
                        value={String(editData.expires_at ?? "")}
                        onChange={(e) => setEditData((p) => ({ ...p, expires_at: e.target.value }))}
                        placeholder="ISO Timestamp oder leer"
                      />
                    ) : (
                      <p className="font-medium">{formatDateTime(listing.expires_at)}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm text-neutral-600">Premium bis</label>
                    {editing ? (
                      <Input
                        value={String(editData.premium_until ?? "")}
                        onChange={(e) => setEditData((p) => ({ ...p, premium_until: e.target.value }))}
                        placeholder="ISO Timestamp oder leer"
                      />
                    ) : (
                      <p className="font-medium">{formatDateTime(listing.premium_until)}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm text-neutral-600">Verbleibende Monate</label>
                    {editing ? (
                      <Input
                        type="number"
                        value={String(editData.remaining_months ?? "")}
                        onChange={(e) => setEditData((p) => ({ ...p, remaining_months: safeInt(e.target.value) }))}
                      />
                    ) : (
                      <p className="font-medium">{listing.remaining_months ?? <span className="text-neutral-400">—</span>}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm text-neutral-600">Verbleibende KM</label>
                    {editing ? (
                      <Input
                        type="number"
                        value={String(editData.remaining_km ?? "")}
                        onChange={(e) => setEditData((p) => ({ ...p, remaining_km: safeInt(e.target.value) }))}
                      />
                    ) : (
                      <p className="font-medium">{listing.remaining_km ?? <span className="text-neutral-400">—</span>}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="images" className="mt-6 space-y-4">
            <div className="rounded-2xl border border-neutral-200 p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="font-medium text-neutral-900">Bilder</h3>
                <div className="text-sm text-neutral-600">
                  {imagesCount} Bilder • Cover Index: <span className="font-medium text-neutral-900">{listing.cover_image_index}</span>
                </div>
              </div>

              {editing && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm text-neutral-600">Cover Image Index</label>
                    <Input
                      type="number"
                      value={String(editData.cover_image_index ?? "")}
                      onChange={(e) => setEditData((p) => ({ ...p, cover_image_index: safeInt(e.target.value) ?? 0 }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm text-neutral-600">Cover Image URL (override)</label>
                    <Input
                      value={String(editData.cover_image_url ?? "")}
                      onChange={(e) => setEditData((p) => ({ ...p, cover_image_url: e.target.value }))}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              )}

              {Array.isArray(listing.images) && listing.images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {listing.images.map((img: any, idx: number) => {
                    const url = typeof img === "string" ? img : img?.url;
                    if (!url) return null;
                    return (
                      <img key={idx} src={url} alt={`Bild ${idx + 1}`} className="h-28 w-full object-cover rounded-xl border border-neutral-200" />
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-neutral-600">Keine Bilder vorhanden.</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="meta" className="mt-6 space-y-6">
            <div className="rounded-2xl border border-neutral-200 p-4 space-y-4">
              <h3 className="font-medium text-neutral-900">Meta & System</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-neutral-200 p-3">
                  <div className="text-xs text-neutral-600">Listing ID</div>
                  <div className="font-mono text-xs break-all text-neutral-900">{listing.id}</div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-3">
                  <div className="text-xs text-neutral-600">Status</div>
                  <div className="font-medium text-neutral-900">{listing.status}</div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-3">
                  <div className="text-xs text-neutral-600">Created by</div>
                  <div className="font-mono text-xs break-all text-neutral-900">{listing.created_by ?? "—"}</div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-3">
                  <div className="text-xs text-neutral-600">User ID</div>
                  <div className="font-mono text-xs break-all text-neutral-900">{listing.user_id ?? "—"}</div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-3">
                  <div className="text-xs text-neutral-600">Archiviert am</div>
                  <div className="font-medium text-neutral-900">{formatDateTime((listing as any).archived_at ?? null)}</div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-3">
                  <div className="text-xs text-neutral-600">Moderations-Notiz</div>
                  <div className="text-sm text-neutral-900 whitespace-pre-wrap">{listing.moderation_note ?? "—"}</div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}