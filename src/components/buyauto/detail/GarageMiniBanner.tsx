import { MapPin } from "lucide-react";
import Link from "next/link";
import type { GaragePublicInfo } from "@/services/garageService";

function initialsFromName(name: string): string {
  const parts = name
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean);

  if (!parts.length) return "G";
  const first = parts[0]?.[0] ?? "G";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return `${first}${last}`.toUpperCase();
}

export function GarageMiniBanner({ garage }: { garage: GaragePublicInfo }) {
  const headerImageUrl =
    typeof garage.headerImageUrl === "string" && garage.headerImageUrl.trim() ? garage.headerImageUrl : null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-neutral-200 shadow-lg">
      <div
        className={headerImageUrl ? "h-40 sm:h-44 bg-cover bg-center" : "h-40 sm:h-44 bg-gradient-to-r from-primary to-primary/80"}
        style={headerImageUrl ? { backgroundImage: `url(${headerImageUrl})` } : undefined}
      />
      <div className="absolute inset-x-0 top-0 h-40 sm:h-44 bg-gradient-to-t from-neutral-900/85 via-neutral-900/45 to-transparent" />

      <div className="relative -mt-10 px-5 pb-5">
        <div className="flex items-end gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/40 bg-white shadow-lg">
            {garage.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={garage.logoUrl} alt={garage.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white text-sm font-semibold text-neutral-700">
                {initialsFromName(garage.name || "Garage")}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-neutral-900">{garage.name || "Garage"}</p>
                {garage.city ? (
                  <p className="truncate text-sm text-neutral-600">{garage.city}</p>
                ) : null}
              </div>

              {garage.slug ? (
                <Link href={`/${garage.slug}`} className="text-sm font-semibold text-primary hover:underline">
                  Profil ansehen
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {garage.bio ? (
          <div className="mt-3 flex items-start gap-2 text-sm text-neutral-600">
            <MapPin className="h-4 w-4 mt-0.5 text-neutral-500" />
            <span className="line-clamp-2">{garage.bio}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}