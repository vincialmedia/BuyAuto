import type { AppProps } from "next/app";
import { Manrope, Caveat } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import MainLayout from "@/components/layout/MainLayout";
import AuthProvider from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import Head from "next/head";
import { useRouter } from "next/router";

// Both families are variable fonts: omitting `weight` loads a single
// variable file per family instead of one file per weight.
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  preload: true,
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
  preload: false,
});

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "BuyAuto",
  url: "https://www.buyauto.ch",
  logo: "https://www.buyauto.ch/share-logo.jpg",
  description:
    "Schweizer Plattform für Leasingübernahme – Leasing übernehmen oder ohne Verlust abgeben.",
  founder: { "@type": "Person", name: "Vincent Hänggi" },
  sameAs: [],
};

// WebSite + SearchAction makes BuyAuto eligible for the Google Sitelinks Searchbox. Shipped
// site-wide here (it was previously dead code gated on a page type that never rendered).
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "BuyAuto",
  url: "https://www.buyauto.ch",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://www.buyauto.ch/suche?query={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const isListingDetailPage = router.pathname === "/fahrzeug/[id]";

  // Never let og:image point at a Vercel preview domain (buyauto-*.vercel.app): if
  // NEXT_PUBLIC_SITE_URL is unset OR misconfigured to a preview host, fall back to the
  // canonical production host. A cross-host og:image breaks social unfurls and muddies
  // the canonical-host signal.
  const rawBase = (process.env.NEXT_PUBLIC_SITE_URL || "").trim();
  const base =
    !rawBase || rawBase.includes("vercel.app")
      ? process.env.NODE_ENV === "production"
        ? "https://www.buyauto.ch"
        : "http://localhost:3000"
      : rawBase;

  const absoluteOgImage = `${base.replace(/\/$/, "")}/share-logo.jpg`;

  return (
    // No overflow-x-hidden on this wrapper: an overflow clip here turns it
    // into the scroll container and silently breaks position:sticky for the
    // header. Horizontal overflow is clipped via overflow-x:clip on html/body
    // in globals.css instead, which keeps sticky working.
    <div className={`${manrope.variable} ${caveat.variable} font-sans min-h-screen`}>
      <AuthProvider>
        <MainLayout>
          <Head>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
            />
          </Head>
          <Component {...pageProps} />

          {!isListingDetailPage ? (
            <Head>
              <meta key="og:image" property="og:image" content={absoluteOgImage} />
              <meta key="tw:card" name="twitter:card" content="summary_large_image" />
              <meta key="tw:image" name="twitter:image" content={absoluteOgImage} />
            </Head>
          ) : null}
        </MainLayout>
        <Toaster />
        <Analytics />
      </AuthProvider>
    </div>
  );
}