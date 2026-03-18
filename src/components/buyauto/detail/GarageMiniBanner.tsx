import Link from "next/link";

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

export function GarageMiniBanner({ garage }: { garage: { id: string; name: string; slug: string | null; city: string | null; bio: string | null; headerImageUrl?: string | null } }) {
  const header = typeof garage.headerImageUrl === "string" && garage.headerImageUrl.trim() ? garage.headerImageUrl : null;
  const href = garage.slug ? `/${garage.slug}` : null;

  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-200/60 bg-white shadow-sm">
      <div
        className="relative h-32 sm:h-40"
        style={header ? { backgroundImage: `url(${header})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/70 via-neutral-900/35 to-transparent" />
        <div className="relative flex h-full items-end justify-between gap-4 p-5">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white/90">Garage</div>
            <div className="truncate text-lg font-bold tracking-tight text-white">{garage.name}</div>
            {garage.city ? <div className="mt-0.5 text-sm text-white/80">{garage.city}</div> : null}
          </div>

          {href ? (
            <Link
              href={href}
              className="shrink-0 rounded-2xl bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-xl border border-white/25 hover:bg-white/25 hover:border-white/40 transition"
            >
              Profil ansehen
            </Link>
          ) : null}
        </div>
      </div>

      {garage.bio ? (
        <div className="p-5">
          <div className="text-sm text-neutral-700 line-clamp-2">{garage.bio}</div>
        </div>
      ) : null}
    </div>
  );
}