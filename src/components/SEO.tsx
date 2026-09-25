import Head from "next/head";
import type { ReactNode } from "react";
import { DEFAULT_LOCALE, localizePath, stripLocale, type Locale } from "@/i18n/config";
import { useLocale, useT, type TFunction } from "@/i18n/runtime";

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

function getAbsoluteUrl(pathOrUrl: string | undefined): string | undefined {
  if (!pathOrUrl) return undefined;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;

  const base = process.env.NEXT_PUBLIC_SITE_URL;
  if (!base) return pathOrUrl;

  const cleanBase = base.replace(/\/$/, "");
  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${cleanBase}${cleanPath}`;
}

/**
 * Canonical / og:url in the page's language. German keeps the URL exactly as
 * passed; fr/it/en get their /fr, /it, /en prefix after the origin. Idempotent:
 * a URL that is already localized is not prefixed twice.
 */
function localizeUrl(pathOrUrl: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return pathOrUrl;
  const match = /^(https?:\/\/[^/?#]+)?(.*)$/.exec(pathOrUrl);
  const origin = match?.[1] ?? "";
  const rest = match?.[2] || "/";
  return `${origin}${localizePath(stripLocale(rest), locale)}`;
}

function buildMeta({ title, description, image, url }: SEOProps, t: TFunction, locale: Locale): Required<
  Pick<SEOProps, "title" | "description" | "image" | "url">
> {
  const fallbackTitle = t("Auto kaufen Schweiz | Leasing, Occasionen & Abo – BuyAuto");
  const fallbackDescription = t(
    "Auto kaufen in der Schweiz – Occasionen, Neuwagen, Leasing, Auto-Abo & Leasingübernahmen auf einer Plattform. Finde jetzt dein passendes Auto mit BuyAuto.",
  );
  const fallbackUrl = getAbsoluteUrl("/") ?? "/";
  const fallbackImage = getAbsoluteUrl("/buyauto-logo.jpg") ?? "/buyauto-logo.jpg";

  const resolvedTitle = (title ?? "").trim() || fallbackTitle;
  const resolvedDescription = (description ?? "").trim() || fallbackDescription;

  const resolvedUrl = localizeUrl(getAbsoluteUrl(url) ?? fallbackUrl, locale);
  const resolvedImage = getAbsoluteUrl(image) ?? fallbackImage;

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    url: resolvedUrl,
    image: resolvedImage,
  };
}

function renderMetaTags(meta: ReturnType<typeof buildMeta>): ReactNode[] {
  return [
    <title key="title">{meta.title}</title>,
    <meta key="desc" name="description" content={meta.description} />,

    <meta key="og:title" property="og:title" content={meta.title} />,
    <meta key="og:description" property="og:description" content={meta.description} />,
    <meta key="og:image" property="og:image" content={meta.image} />,
    <meta key="og:url" property="og:url" content={meta.url} />,
    <meta key="og:site_name" property="og:site_name" content="BuyAuto" />,
    <meta key="og:type" property="og:type" content="website" />,

    <meta key="tw:card" name="twitter:card" content="summary_large_image" />,
    <meta key="tw:title" name="twitter:title" content={meta.title} />,
    <meta key="tw:desc" name="twitter:description" content={meta.description} />,
    <meta key="tw:image" name="twitter:image" content={meta.image} />,

    <link key="canonical" rel="canonical" href={meta.url} />,
  ];
}

export function SEOElements(props: SEOProps) {
  const t = useT();
  const locale = useLocale();
  const meta = buildMeta(props, t, locale);
  return <>{renderMetaTags(meta)}</>;
}

export function SEO(props: SEOProps) {
  const t = useT();
  const locale = useLocale();
  const meta = buildMeta(props, t, locale);
  return <Head>{renderMetaTags(meta)}</Head>;
}