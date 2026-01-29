import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OwnerMiniProfileProps {
  sellerType?: string | null;
  name?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
  badgeText?: string | null;
}

function getInitials(name?: string | null): string {
  const n = (name ?? "").trim();
  if (!n) return "A";
  const parts = n.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "A";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : undefined;
  return `${first}${second ?? ""}`.toUpperCase();
}

export function OwnerMiniProfile({ sellerType, name, location, avatarUrl, badgeText }: OwnerMiniProfileProps) {
  const isGarage = (sellerType ?? "") === "garage";
  const title = (name ?? "").trim() || (isGarage ? "Garage" : "Privatanbieter");
  const subtitle = (location ?? "").trim() || "Standort nicht angegeben";
  const fallback = getInitials(title);

  return (
    <Card className="border-neutral-200/60 shadow-sm bg-white rounded-3xl overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="relative h-12 w-12 rounded-2xl overflow-hidden bg-neutral-100 ring-1 ring-neutral-200/70 flex-shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={title} fill className="object-cover" sizes="48px" />
            ) : (
              <div className="h-full w-full grid place-items-center text-sm font-bold text-neutral-700">
                {fallback}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-neutral-900 truncate">{title}</p>
              {isGarage && (
                <Badge className="bg-emerald-600 text-white border-0">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                  Garage
                </Badge>
              )}
              {badgeText && !isGarage && (
                <Badge className={cn("bg-neutral-900 text-white border-0", badgeText ? "inline-flex" : "hidden")}>
                  {badgeText}
                </Badge>
              )}
            </div>

            <div className="mt-1 flex items-center gap-2 text-sm text-neutral-600">
              <MapPin className="h-4 w-4 text-neutral-400 flex-shrink-0" />
              <span className="truncate">{subtitle}</span>
            </div>

            <p className="mt-3 text-xs text-neutral-500">
              Du schreibst direkt dem Anbieter. Verlauf bleibt bei diesem Inserat gespeichert.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}