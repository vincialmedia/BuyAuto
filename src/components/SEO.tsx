import Head from "next/head";
import type { ReactNode } from "react";

export interface SEOProps {
  /** Required: every page needs its own title, description and canonical. */
  title: string;
  description: string;
  /** Absolute URL or site path of the page itself (the canonical). */
  url: string;
  image?: string;
}

// Only for a blank title or description at runtime: neutral BuyAuto wording from the
// site-wide Organization, never a generic car-buying pitch.
const FALLBACK_TITLE = "BuyAuto";
const FALLBACK_DESCRIPTION =
  "Schweizer Marktplatz für Leasingübernahmen von Privatpersonen und Garagen: Leasing übernehmen oder abgeben.";

function getAbsoluteUrl(pathOrUrl: string | undefined): string | undefined {
  if (!pathOrUrl) return undefined;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;

  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return pathOrUrl;

  const cleanBase = base.replace(/\/$/, "");
  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${cleanBase}${cleanPath}`;
}

type ResolvedMeta = { title: string; description: string; url: string | undefined; image: string };

function buildMeta({ title, description, image, url }: SEOProps): ResolvedMeta {
  const fallbackImage = getAbsoluteUrl("/buyauto-logo.jpg") ?? "/buyauto-logo.jpg";

  return {
    title: title.trim() || FALLBACK_TITLE,
    description: description.trim() || FALLBACK_DESCRIPTION,
    // No fallback: a missing URL leaves the canonical out instead of pointing it at
    // the home page, which would ask Google to drop this page from the index.
    url: getAbsoluteUrl(url.trim() || undefined),
    image: getAbsoluteUrl(image) ?? fallbackImage,
  };
}

function renderMetaTags(meta: ResolvedMeta): ReactNode[] {
  const tags: ReactNode[] = [
    <title key="title">{meta.title}</title>,
    <meta key="desc" name="description" content={meta.description} />,

    <meta key="og:title" property="og:title" content={meta.title} />,
    <meta key="og:description" property="og:description" content={meta.description} />,
    <meta key="og:image" property="og:image" content={meta.image} />,
    <meta key="og:site_name" property="og:site_name" content="BuyAuto" />,
    <meta key="og:type" property="og:type" content="website" />,

    <meta key="tw:card" name="twitter:card" content="summary_large_image" />,
    <meta key="tw:title" name="twitter:title" content={meta.title} />,
    <meta key="tw:desc" name="twitter:description" content={meta.description} />,
    <meta key="tw:image" name="twitter:image" content={meta.image} />,
  ];

  if (meta.url) {
    tags.push(
      <meta key="og:url" property="og:url" content={meta.url} />,
      <link key="canonical" rel="canonical" href={meta.url} />
    );
  }

  return tags;
}

export function SEOElements(props: SEOProps) {
  const meta = buildMeta(props);
  return <>{renderMetaTags(meta)}</>;
}

export function SEO(props: SEOProps) {
  const meta = buildMeta(props);
  return <Head>{renderMetaTags(meta)}</Head>;
}
