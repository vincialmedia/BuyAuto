import type { GetServerSideProps } from "next";
import { SEO } from "@/components/SEO";
import { getPublicGarageBySlug } from "@/services/garageService";
import { PublicDealerInventory } from "@/components/buyauto/dealer/PublicDealerInventory";
import { DealerHeroHeader } from "@/components/buyauto/dealer/DealerHeroHeader";
import { DealerAboutAndMap } from "@/components/buyauto/dealer/DealerAboutAndMap";
import { DealerTeamAndHours } from "@/components/buyauto/dealer/DealerTeamAndHours";
import { StructuredData } from "@/components/buyauto/StructuredData";

type PublicGarage = NonNullable<Awaited<ReturnType<typeof getPublicGarageBySlug>>>;

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
    const garage = await getPublicGarageBySlug(dealerSlug);

    if (!garage || !garage.slug) {
      return { notFound: true };
    }

    const base =
      (process.env.NEXT_PUBLIC_SITE_URL || "").trim() ||
      (process.env.NODE_ENV === "production" ? "https://www.buyauto.ch" : "http://localhost:3000");

    const absoluteUrl = `${base.replace(/\/$/, "")}/${garage.slug}`;
    const logoUrl = garage.logo_url ?? null;

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
        </div>
      </main>
    );
  }

  const { garage, logoUrl, absoluteUrl } = props;

  const title = `${garage.garage_name} – Fahrzeuge & Angebote | BuyAuto`;
  const description = getSafeDescription(garage.description);
  const image = garage.header_image_url || logoUrl || "/buyauto-logo.png";

  const openingHours = garage.opening_hours;
  const teamMembers = garage.team_members;

  return (
    <>
      <SEO title={title} description={description} image={image} url={absoluteUrl} />
      <StructuredData
        type="dealer"
        dealerData={{
          name: garage.garage_name,
          slug: garage.slug,
          description: garage.description,
          city: garage.city,
          websiteUrl: garage.website_url,
          phoneNumber: garage.phone_number,
          contactEmail: garage.contact_email,
          headerImageUrl: garage.header_image_url,
          logoUrl,
          openingHours,
        }}
      />

      <main className="min-h-screen bg-white">
        <DealerHeroHeader
          garageName={garage.garage_name}
          slug={garage.slug}
          city={garage.city}
          description={garage.description}
          headerImageUrl={garage.header_image_url}
          logoUrl={logoUrl}
          websiteUrl={garage.website_url}
          phoneNumber={garage.phone_number}
          contactEmail={garage.contact_email}
          services={garage.services || []}
        />

        <div className="pt-28 md:pt-32" />

        <DealerAboutAndMap
          garageName={garage.garage_name}
          city={garage.city}
          description={garage.description}
          services={garage.services || []}
          websiteUrl={garage.website_url}
          phoneNumber={garage.phone_number}
          contactEmail={garage.contact_email}
          className="pb-16 md:pb-20"
        />

        <DealerTeamAndHours teamMembers={teamMembers} openingHours={openingHours} className="pb-20 md:pb-24" />

        <section id="inventory" className="mx-auto max-w-6xl px-6 pb-16 md:pb-24">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Inventar</h2>
              <p className="mt-2 text-sm text-neutral-600">Finde alle Fahrzeuge dieses Händlers – mit Filtern & Sortierung.</p>
            </div>
          </div>

          <PublicDealerInventory garageId={garage.id} />
        </section>
      </main>
    </>
  );
}