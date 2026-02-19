import type { GetServerSideProps } from "next";
import Link from "next/link";
import { SEO } from "@/components/SEO";
import { getGarageBySlug } from "@/services/garageService";
import { getGarageLogoPublicUrl } from "@/services/storageService";

type PublicGarage = NonNullable<Awaited<ReturnType<typeof getGarageBySlug>>>;

type PageProps =
  | {
      ok: true;
      garage: PublicGarage;
      logoUrl: string | null;
      absoluteUrl: string;
    }
  | {
      ok: false;
    };

function formatPhoneForTel(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

function getSafeDescription(description: string | null): string {
  const d = (description ?? "").trim();
  if (!d) return "Fahrzeuge & Angebote von diesem Händler auf BuyAuto entdecken.";
  return d.length > 160 ? `${d.slice(0, 157)}...` : d;
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const dealerSlugRaw = ctx.params?.dealerSlug;
  const dealerSlug = typeof dealerSlugRaw === "string" ? dealerSlugRaw : null;

  if (!dealerSlug) return { props: { ok: false } };

  try {
    const garage = await getGarageBySlug(dealerSlug);

    if (!garage || !garage.slug) {
      return { notFound: true };
    }

    const base =
      (process.env.NEXT_PUBLIC_SITE_URL || "").trim() ||
      (process.env.NODE_ENV === "production" ? "https://www.buyauto.ch" : "http://localhost:3000");

    const absoluteUrl = `${base.replace(/\/$/, "")}/${garage.slug}`;
    const logoUrl = getGarageLogoPublicUrl(garage.id);

    return {
      props: {
        ok: true,
        garage,
        logoUrl,
        absoluteUrl,
      },
    };
  } catch {
    return { props: { ok: false } };
  }
};

export default function DealerMicrositePage(props: PageProps) {
  if (!props.ok) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Händlerprofil nicht verfügbar</h1>
          <p className="mt-3 text-neutral-600">Dieses Händlerprofil konnte nicht geladen werden.</p>
          <div className="mt-8">
            <Link className="text-primary underline underline-offset-4" href="/">
              Zur Startseite
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { garage, logoUrl, absoluteUrl } = props;

  const title = `${garage.garage_name} – Fahrzeuge & Angebote | BuyAuto`;
  const description = getSafeDescription(garage.description);
  const image = garage.header_image_url || logoUrl || "/buyauto-logo.png";

  const telHref = garage.phone_number ? `tel:${formatPhoneForTel(garage.phone_number)}` : null;
  const hasContact =
    Boolean(garage.website_url?.trim()) || Boolean(garage.phone_number?.trim()) || Boolean(garage.contact_email?.trim());

  return (
    <>
      <SEO title={title} description={description} image={image} url={absoluteUrl} />

      <main className="min-h-screen bg-white">
        <header className="relative overflow-hidden">
          <div className="absolute inset-0">
            <div
              className="h-full w-full bg-neutral-900"
              style={{
                backgroundImage: garage.header_image_url ? `url(${garage.header_image_url})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/80 to-transparent" />
          </div>

          <div className="relative mx-auto max-w-6xl px-6 pb-14 pt-16 md:pb-16 md:pt-24">
            <div className="inline-flex w-full flex-col gap-6 rounded-3xl bg-white/25 p-6 shadow-2xl backdrop-blur-xl ring-1 ring-white/30 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white/20 ring-1 ring-white/30">
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoUrl} alt={`${garage.garage_name} Logo`} className="h-full w-full object-cover" />
                    ) : null}
                  </div>

                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">{garage.garage_name}</h1>
                    <p className="mt-1 text-sm text-white/80">
                      {garage.city ? `${garage.city} • ` : ""}Händlerprofil auf BuyAuto
                    </p>
                  </div>
                </div>

                {hasContact ? (
                  <div className="flex flex-wrap gap-3">
                    {garage.website_url ? (
                      <a
                        href={garage.website_url}
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

                    {garage.contact_email ? (
                      <a
                        href={`mailto:${garage.contact_email}`}
                        className="rounded-2xl border border-white/30 bg-white/20 px-4 py-2 text-sm font-medium text-white hover:border-white/50 hover:bg-white/30"
                      >
                        E-Mail
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {garage.description ? (
                <p className="max-w-3xl text-base leading-relaxed text-white/90">{garage.description}</p>
              ) : (
                <p className="max-w-3xl text-base leading-relaxed text-white/90">
                  Entdecke Fahrzeuge und Angebote von {garage.garage_name}.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {(garage.services || []).slice(0, 12).map((service) => (
                  <span
                    key={service}
                    className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium text-white/90"
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <div className="grid gap-10 md:grid-cols-3">
            <div className="md:col-span-2">
              <h2 className="text-xl font-bold tracking-tight text-neutral-900">Über {garage.garage_name}</h2>
              <div className="mt-4 space-y-3 text-neutral-600">
                <p>
                  Hier entsteht das öffentliche Händlerprofil. In Phase 2 folgt das Inventar mit Filtern direkt auf dieser
                  Seite.
                </p>
                <p className="text-sm">
                  Öffentliches Profil:{" "}
                  <span className="font-medium text-neutral-900">{garage.slug ? `/${garage.slug}` : ""}</span>
                </p>
              </div>
            </div>

            <aside className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-lg">
              <h3 className="text-sm font-bold tracking-tight text-neutral-900">Kontakt</h3>
              <div className="mt-4 space-y-3 text-sm text-neutral-600">
                {garage.city ? (
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">Ort</div>
                    <div className="mt-1 text-neutral-900">{garage.city}</div>
                  </div>
                ) : null}

                {garage.phone_number ? (
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">Telefon</div>
                    <div className="mt-1">
                      <a className="text-neutral-900 underline underline-offset-4" href={telHref ?? undefined}>
                        {garage.phone_number}
                      </a>
                    </div>
                  </div>
                ) : null}

                {garage.contact_email ? (
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">E-Mail</div>
                    <div className="mt-1">
                      <a
                        className="text-neutral-900 underline underline-offset-4"
                        href={`mailto:${garage.contact_email}`}
                      >
                        {garage.contact_email}
                      </a>
                    </div>
                  </div>
                ) : null}

                {garage.website_url ? (
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">Website</div>
                    <div className="mt-1">
                      <a
                        className="text-neutral-900 underline underline-offset-4"
                        href={garage.website_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {garage.website_url}
                      </a>
                    </div>
                  </div>
                ) : null}

                <div className="pt-3">
                  <Link href="/suche" className="inline-flex text-primary underline underline-offset-4">
                    Fahrzeuge auf BuyAuto suchen
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}