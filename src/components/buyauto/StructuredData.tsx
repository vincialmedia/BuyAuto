import Head from "next/head";

/**
 * AutoDealer JSON-LD for a garage microsite (/[dealerSlug]).
 *
 * BuyAuto's own Organization and WebSite are set site-wide in _app.tsx, so this
 * component adds only the garage. It used to emit a second Organization with old
 * copy and unused homepage/listing variants; those are gone.
 */
interface StructuredDataProps {
  type: "dealer";
  dealerData: {
    name: string;
    slug: string;
    description?: string | null;
    city?: string | null;
    websiteUrl?: string | null;
    phoneNumber?: string | null;
    contactEmail?: string | null;
    headerImageUrl?: string | null;
    logoUrl?: string | null;
    openingHours?: unknown;
  };
}

function getBaseUrl(): string {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  if (env) return env.replace(/\/$/, "");
  return process.env.NODE_ENV === "production" ? "https://www.buyauto.ch" : "http://localhost:3000";
}

function normalizeOpeningHours(value: unknown): Record<string, { from?: string | null; to?: string | null; closed?: boolean | null }> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, { from?: string | null; to?: string | null; closed?: boolean | null }>;
}

const DAY_OF_WEEK: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function StructuredData({ dealerData }: StructuredDataProps) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/${dealerData.slug}`;
  const hours = normalizeOpeningHours(dealerData.openingHours);

  const openingHoursSpecification = hours
    ? Object.entries(hours)
        .map(([dayKey, v]) => {
          const closed = Boolean(v?.closed);
          const from = (v?.from ?? "").toString().trim();
          const to = (v?.to ?? "").toString().trim();
          if (closed || (!from && !to)) return null;

          const dayOfWeek = DAY_OF_WEEK[dayKey];
          if (!dayOfWeek) return null;

          return {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: `https://schema.org/${dayOfWeek}`,
            opens: from || undefined,
            closes: to || undefined,
          };
        })
        .filter(Boolean)
    : [];

  const dealerSchema = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: dealerData.name,
    url,
    image: dealerData.headerImageUrl || dealerData.logoUrl || `${baseUrl}/buyauto-logo.png`,
    logo: dealerData.logoUrl || `${baseUrl}/buyauto-logo.png`,
    description: dealerData.description?.trim() || undefined,
    telephone: dealerData.phoneNumber?.trim() || undefined,
    email: dealerData.contactEmail?.trim() || undefined,
    address: {
      "@type": "PostalAddress",
      addressCountry: "CH",
      addressLocality: dealerData.city?.trim() || undefined,
    },
    sameAs: dealerData.websiteUrl?.trim() ? [dealerData.websiteUrl.trim()] : [],
    openingHoursSpecification,
  };

  return (
    <Head>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(dealerSchema) }} />
    </Head>
  );
}
