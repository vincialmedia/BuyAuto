import Head from "next/head";

import { PADKOS_INDEXABLE, padkosCanonical } from "@/lib/padkos/routes";

interface PadkosSeoProps {
  title: string;
  description: string;
  /** Route path including the /padkos prefix, used for the canonical URL. */
  path: string;
  /**
   * Checkout, account and other private/utility pages stay noindex even after
   * the shop becomes indexable on its own domain.
   */
  alwaysNoindex?: boolean;
  /** de-AT ↔ en alternates; only the two landing pages have a translation. */
  hreflang?: Array<{ lang: string; path: string }>;
  /** JSON-LD blocks, rendered into the initial HTML. */
  jsonLd?: object[];
  lang?: "de" | "en";
}

/**
 * Per-page SEO for the Padkos shop: title, description, canonical, robots,
 * hreflang and structured data. Open Graph stays minimal until real imagery
 * exists — a wrong og:image is worse than none.
 */
export function PadkosSeo({
  title,
  description,
  path,
  alwaysNoindex = false,
  hreflang,
  jsonLd,
  lang = "de",
}: PadkosSeoProps) {
  const indexable = PADKOS_INDEXABLE && !alwaysNoindex;
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={indexable ? "index, follow" : "noindex, nofollow"} />
      <link rel="canonical" href={padkosCanonical(path)} />
      {hreflang?.map(({ lang: hl, path: hp }) => (
        <link key={hl} rel="alternate" hrefLang={hl} href={padkosCanonical(hp)} />
      ))}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content={lang === "de" ? "de_AT" : "en_US"} />
      {jsonLd?.map((block, i) => (
        <script
          // Stable per page — the array is a build-time constant.
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </Head>
  );
}
