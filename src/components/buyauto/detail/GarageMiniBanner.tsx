import { MapPin, Store } from "lucide-react";
import Link from "next/link";

export interface GaragePublicInfo {
  id: string;
  name: string;
  city: string | null;
  bio: string | null;
  slug: string | null;
  logoUrl: string | null;
}

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

export function GarageMiniBanner({
  garage,
  fallbackLocation,
}: {
  garage: GaragePublicInfo;
  fallbackLocation?: string | null;
}) {
  const locationText = garage.city || fallbackLocation || null;
  const Wrapper = garage.slug ? Link : "div";
  const wrapperProps = garage.slug ? { href: `/${garage.slug}` } : {};

  return (
    <Wrapper
      {...(wrapperProps as any)}
      className={[
        "group block",
        "bg-white rounded-3xl border border-neutral-200/60 shadow-sm",
        "p-5 sm:p-6",
        garage.slug ? "hover:shadow-md hover:-translate-y-[1px] transition-all" : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          {garage.logoUrl ? (
            <img
              src={garage.logoUrl}
              alt={`${garage.name} Logo`}
              className="h-14 w-14 rounded-2xl object-cover border border-neutral-200/60 bg-white"
              loading="lazy"
            />
          ) : (
            <div className="h-14 w-14 rounded-2xl border border-neutral-200/60 bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center text-sm font-bold text-neutral-700">
              {initialsFromName(garage.name)}
            </div>
          )}
          <div className="absolute -bottom-2 -right-2 h-7 w-7 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow">
            <Store className="h-4 w-4" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="text-lg font-bold tracking-tight text-neutral-900">
              {garage.name}
            </div>
            <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-700">
              Garage
            </span>
          </div>

          {locationText && (
            <div className="mt-1 flex items-center gap-2 text-sm text-neutral-600">
              <MapPin className="h-4 w-4 text-neutral-500" />
              <span className="truncate">{locationText}</span>
            </div>
          )}

          {garage.bio && garage.bio.trim() && (
            <p
              className={[
                "mt-3 text-sm text-neutral-600 leading-relaxed",
                "[display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden",
              ].join(" ")}
            >
              {garage.bio}
            </p>
          )}

          {garage.slug && (
            <div className="mt-3 text-sm font-medium text-neutral-900/80 group-hover:text-neutral-900 transition-colors">
              Profil ansehen
            </div>
          )}
        </div>
      </div>
    </Wrapper>
  );
}