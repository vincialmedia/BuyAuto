import type { AppProps } from "next/app";
import { Manrope, Caveat } from "next/font/google";
import MainLayout from "@/components/layout/MainLayout";
import AuthProvider from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import "@/styles/globals.css";

// Configure Manrope font from Google Fonts for automatic optimization
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

// Configure Caveat font for handwritten/scribbled text
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${manrope.variable} ${caveat.variable} font-sans overflow-x-hidden min-h-screen`}>
      <AuthProvider>
        <MainLayout>
          <Component {...pageProps} />
        </MainLayout>
        <Toaster />
      </AuthProvider>
      <Analytics />
    </div>
  );
}
