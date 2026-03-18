import type { AppProps } from "next/app";
import { Manrope, Caveat } from "next/font/google";
import Script from "next/script";
import { useRouter } from "next/router";
import { Analytics } from "@vercel/analytics/react";
import MainLayout from "@/components/layout/MainLayout";
import AuthProvider from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";

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
  const isEmbedRoute = router.pathname.startsWith("/embed/");

  return (
    <div className={`${manrope.variable} ${caveat.variable} font-sans overflow-x-hidden min-h-screen`}>
      {isEmbedRoute ? (
        <Component {...pageProps} />
      ) : (
        <>
          <AuthProvider>
            <MainLayout>
              <Script
                id="google-analytics-4"
                src="https://www.googletagmanager.com/gtag/js?id=G-6GJ6D58G1S"
                strategy="afterInteractive"
              />
              <Script
                id="google-analytics-4-inline"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', 'G-6GJ6D58G1S', {
                      page_path: window.location.pathname,
                    });
                  `,
                }}
              />
              <Component {...pageProps} />
            </MainLayout>
            <Toaster />
          </AuthProvider>
          <Analytics />
        </>
      )}
    </div>
  );
}