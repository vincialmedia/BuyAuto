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

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  const isListingDetailPage = router.pathname === "/fahrzeug/[id]";

  const base =
    (process.env.NEXT_PUBLIC_SITE_URL || "").trim() ||
    (process.env.NODE_ENV === "production" ? "https://www.buyauto.ch" : "http://localhost:3000");

  const absoluteOgImage = `${base.replace(/\/$/, "")}/share-logo.jpg`;

  return (
    <div className={`${manrope.variable} ${caveat.variable} font-sans overflow-x-hidden min-h-screen`}>
      <AuthProvider>
        <MainLayout>
          <Component {...pageProps} />

          {!isListingDetailPage ? (
            <Head>
              <meta key="og:image" property="og:image" content={absoluteOgImage} />
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