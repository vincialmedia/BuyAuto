import Head from "next/head";
import type { ReactNode } from "react";

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

function buildMeta({ title, description, image, url }: SEOProps): Required<
  Pick<SEOProps, "title" | "description" | "image" | "url">
> {
  const fallbackTitle = "Auto kaufen Schweiz | Leasing, Occasionen & Abo – BuyAuto";
  const fallbackDescription =
    "Auto kaufen in der Schweiz – Occasionen, Neuwagen, Leasing, Auto-Abo & Leasingübernahmen auf einer Plattform. Finde jetzt dein passendes Auto mit BuyAuto.";
  const fallbackUrl = getAbsoluteUrl("/") ?? "/";
  const fallbackImage = getAbsoluteUrl("/ChatGPT_Image_Mar_24_2026_02_28_34_PM.jpg") ?? "/ChatGPT_Image_Mar_24_2026_02_28_34_PM.jpg";

  const resolvedTitle = (title ?? "").trim() || fallbackTitle;
  const resolvedDescription = (description ?? "").trim() || fallbackDescription;

  const resolvedUrl = getAbsoluteUrl(url) ?? fallbackUrl;
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
  const meta = buildMeta(props);
  return <>{renderMetaTags(meta)}</>;
}

export function SEO(props: SEOProps) {
  const meta = buildMeta(props);
  return <Head>{renderMetaTags(meta)}</Head>;
}