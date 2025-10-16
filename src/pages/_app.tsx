import type { AppProps } from "next/app";
import localFont from "next/font/local";
import MainLayout from "@/components/layout/MainLayout";
import AuthProvider from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";

// Load local fonts with automatic optimization
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap", // Ensures text is visible during font load
  preload: true,
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  preload: true,
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} overflow-x-hidden min-h-screen`}>
      <AuthProvider>
        <MainLayout>
          <Component {...pageProps} />
        </MainLayout>
        <Toaster />
      </AuthProvider>
    </div>
  );
}
