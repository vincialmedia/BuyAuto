import Link from "next/link";
import { cn } from "@/lib/utils";

interface DealerHeroHeaderProps {
  garageName: string;
  slug?: string | null;
  city?: string | null;
  description?: string | null;
  headerImageUrl?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  phoneNumber?: string | null;
  contactEmail?: string | null;
  services?: string[] | null;
  className?: string;
}

function formatPhoneForTel(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

function getSafeDescription(description: string | null | undefined): string {
  const d = (description ?? "").trim();
  if (!d) return "Fahrzeuge & Angebote von diesem Händler auf BuyAuto entdecken.";
  return d.length > 160 ? `${d.slice(0, 157)}...` : d;
}

export function DealerHeroHeader({
  garageName,
  slug,
  city,
  description,
  headerImageUrl,
  logoUrl,
  websiteUrl,
  phoneNumber,
  contactEmail,
  services,
  className,
}: DealerHeroHeaderProps) {
  const telHref = phoneNumber?.trim() ? `tel:${formatPhoneForTel(phoneNumber)}` : null;
  const hasContact = Boolean(websiteUrl?.trim()) || Boolean(phoneNumber?.trim()) || Boolean(contactEmail?.trim());
  const safeServices = Array.isArray(services) ? services.filter((s) => typeof s === "string" && s.trim().length > 0) : [];
  const shortDescription = getSafeDescription(description);
  const publicPath = slug?.trim() ? slug.trim() : "";

  return (
    <header className={cn("relative overflow-hidden", className)}>
      <div className="absolute inset-0">
        <div
          className="h-full w-full bg-neutral-900"
          style={{
            backgroundImage: headerImageUrl ? `url(${headerImageUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/80 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pt-16 md:pt-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/85 backdrop-blur-md">
            Händlerprofil auf BuyAuto
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl">{garageName}</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/85 md:text-base">{shortDescription}</p>
        </div>
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-10 md:pb-28">
        <div className="h-10 md:h-16" />
      </div>

      <div className="absolute inset-x-0 bottom-0 translate-y-1/2">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl bg-white/25 p-6 shadow-2xl backdrop-blur-xl ring-1 ring-white/30 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white/20 ring-1 ring-white/30">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt={`${garageName} Logo`} className="h-full w-full object-cover" />
                  ) : null}
                </div>

                <div className="min-w-0">
                  <div className="text-2xl font-bold tracking-tight text-white md:text-3xl">{garageName}</div>
                  <div className="mt-1 text-sm text-white/80">
                    {city?.trim() ? `${city.trim()} • ` : ""}Fahrzeuge & Angebote
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {safeServices.slice(0, 10).map((service) => (
                      <span
                        key={service}
                        className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-medium text-white/90"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {hasContact ? (
                <div className="flex flex-wrap gap-2 md:justify-end">
                  {websiteUrl?.trim() ? (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-2xl border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white hover:border-white/50 hover:bg-white/30"
                    >
                      Website
                    </a>
                  ) : null}

                  {telHref ? (
                    <a
                      href={telHref}
                      className="rounded-2xl border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white hover:border-white/50 hover:bg-white/30"
                    >
                      Anrufen
                    </a>
                  ) : null}

                  {contactEmail?.trim() ? (
                    <a
                      href={`mailto:${contactEmail.trim()}`}
                      className="rounded-2xl border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white hover:border-white/50 hover:bg-white/30"
                    >
                      E-Mail
                    </a>
                  ) : null}

                  <Link
                    href="#inventory"
                    className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-white/90"
                  >
                    Zum Inventar
                  </Link>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Link
                    href="#inventory"
                    className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-white/90"
                  >
                    Zum Inventar
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-white/70">
            <div>{publicPath ? `buyauto.ch/${publicPath}` : "buyauto.ch"}</div>
            <div>© 2026 BuyAuto</div>
          </div>
        </div>
      </div>
    </header>
  );
}