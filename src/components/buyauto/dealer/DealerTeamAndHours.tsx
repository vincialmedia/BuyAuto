import { cn } from "@/lib/utils";

type OpeningHoursDay = {
  from?: string | null;
  to?: string | null;
  closed?: boolean | null;
};

type TeamMember = {
  id?: string;
  name?: string | null;
  role?: string | null;
  bio?: string | null;
  image_url?: string | null;
};

const DAYS: Array<{ key: string; label: string }> = [
  { key: "monday", label: "Montag" },
  { key: "tuesday", label: "Dienstag" },
  { key: "wednesday", label: "Mittwoch" },
  { key: "thursday", label: "Donnerstag" },
  { key: "friday", label: "Freitag" },
  { key: "saturday", label: "Samstag" },
  { key: "sunday", label: "Sonntag" },
];

function normalizeOpeningHours(value: unknown): Record<string, OpeningHoursDay> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, OpeningHoursDay>;
}

function normalizeTeam(value: unknown): TeamMember[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((m) => m && typeof m === "object")
    .map((m) => m as TeamMember)
    .filter((m) => (m.name ?? "").toString().trim().length > 0);
}

function formatHours(day: OpeningHoursDay | undefined): string {
  if (!day) return "—";
  if (day.closed) return "Geschlossen";
  const from = (day.from ?? "").toString().trim();
  const to = (day.to ?? "").toString().trim();
  if (!from && !to) return "—";
  if (from && to) return `${from} – ${to}`;
  return from || to || "—";
}

interface DealerTeamAndHoursProps {
  teamMembers?: unknown;
  openingHours?: unknown;
  className?: string;
}

export function DealerTeamAndHours({ teamMembers, openingHours, className }: DealerTeamAndHoursProps) {
  const hours = normalizeOpeningHours(openingHours);
  const team = normalizeTeam(teamMembers);

  return (
    <section className={cn("mx-auto max-w-6xl px-6", className)}>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-lg">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">Team</h2>

            {team.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-600">
                Dieses Team-Profil wird vom Händler ergänzt. In der Garage-Übersicht können Teammitglieder gepflegt werden.
              </p>
            ) : (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {team.slice(0, 8).map((m, idx) => (
                  <div key={m.id ?? `${m.name}-${idx}`} className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 overflow-hidden rounded-2xl bg-neutral-100">
                        {m.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.image_url}
                            alt={m.name ?? "Team"}
                            width={48}
                            height={48}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-neutral-900">{m.name}</div>
                        {m.role?.trim() ? <div className="text-xs text-neutral-600">{m.role.trim()}</div> : null}
                      </div>
                    </div>
                    {m.bio?.trim() ? <p className="mt-3 text-sm text-neutral-600">{m.bio.trim()}</p> : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-lg">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">Öffnungszeiten</h2>
            {hours ? (
              <div className="mt-4 space-y-3">
                {DAYS.map((d) => (
                  <div key={d.key} className="flex items-center justify-between gap-4">
                    <div className="text-sm font-medium text-neutral-700">{d.label}</div>
                    <div className="text-sm font-semibold text-neutral-900">{formatHours(hours[d.key])}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-neutral-600">Keine Öffnungszeiten hinterlegt.</p>
            )}
            <p className="mt-4 text-xs text-neutral-500">Angaben ohne Gewähr. Bei Unsicherheit bitte direkt beim Händler nachfragen.</p>
          </div>
        </div>
      </div>
    </section>
  );
}