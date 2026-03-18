import Link from "next/link";
import { cn } from "@/lib/utils";

interface DealerAboutAndMapProps {
  garageName: string;
  city?: string | null;
  description?: string | null;
  services?: string[] | null;
  websiteUrl?: string | null;
  phoneNumber?: string | null;
  contactEmail?: string | null;
  className?: string;
}

function buildGoogleMapsQuery(garageName: string, city: string | null | undefined): string {
  const parts = [garageName, city?.trim() || null, "Schweiz"].filter(Boolean) as string[];
  return parts.join(", ");
}

export function DealerAboutAndMap({
  garageName,
  city,
  description,
  services,
  websiteUrl,
  phoneNumber,
  contactEmail,
  className,
}: DealerAboutAndMapProps) {
  const safeServices = Array.isArray(services) ? services.filter((s) => typeof s === "string" && s.trim().length > 0) : [];
  const mapQuery = buildGoogleMapsQuery(garageName, city);
  const embedSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`;
  const openInMapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <section className={cn("mx-auto max-w-6xl px-6", className)}>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-lg">
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">Über {garageName}</h2>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              {description?.trim()
                ? description.trim()
                : `Entdecke Fahrzeuge und Angebote von ${garageName}. Dieses Profil wird laufend mit weiteren Informationen ergänzt.`}
            </p>

            {safeServices.length > 0 ? (
              <div className="mt-5">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Dienstleistungen</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {safeServices.slice(0, 18).map((service) => (
                    <span key={service} className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {city?.trim() ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Ort</div>
                  <div className="mt-1 text-sm font-semibold text-neutral-900">{city.trim()}</div>
                </div>
              ) : null}

              {phoneNumber?.trim() ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Telefon</div>
                  <div className="mt-1 text-sm">
                    <a className="font-semibold text-neutral-900 underline underline-offset-4" href={`tel:${phoneNumber.trim()}`}>
                      {phoneNumber.trim()}
                    </a>
                  </div>
                </div>
              ) : null}

              {contactEmail?.trim() ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">E-Mail</div>
                  <div className="mt-1 text-sm">
                    <a
                      className="font-semibold text-neutral-900 underline underline-offset-4"
                      href={`mailto:${contactEmail.trim()}`}
                    >
                      {contactEmail.trim()}
                    </a>
                  </div>
                </div>
              ) : null}

              {websiteUrl?.trim() ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Website</div>
                  <div className="mt-1 text-sm">
                    <a
                      className="font-semibold text-neutral-900 underline underline-offset-4"
                      href={websiteUrl.trim()}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {websiteUrl.trim()}
                    </a>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href="/suche" className="inline-flex text-sm font-semibold text-primary underline underline-offset-4">
                Fahrzeuge auf BuyAuto suchen
              </Link>
              <a
                href={openInMapsHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-sm font-semibold text-neutral-900 underline underline-offset-4"
              >
                In Google Maps öffnen
              </a>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-lg">
            <div className="border-b border-neutral-200 px-5 py-4">
              <div className="text-sm font-bold tracking-tight text-neutral-900">Standort</div>
              <div className="mt-1 text-xs text-neutral-600">{mapQuery}</div>
            </div>

            <div className="aspect-[4/3] w-full bg-neutral-100">
              <iframe
                title={`Google Maps: ${mapQuery}`}
                src={embedSrc}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <p className="mt-3 text-xs text-neutral-500">
            Hinweis: Die Karte basiert auf den öffentlich verfügbaren Profilangaben und kann je nach Eingabe leicht abweichen.
          </p>
        </div>
      </div>
    </section>
  );
}