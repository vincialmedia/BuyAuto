import type { AppProps } from "next/app";
import { Manrope } from "next/font/google";
import MainLayout from "@/components/layout/MainLayout";
import AuthProvider from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";

// Configure Manrope font from Google Fonts for automatic optimization
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${manrope.variable} font-sans overflow-x-hidden min-h-screen`}>
      <AuthProvider>
        <MainLayout>
          <Component {...pageProps} />
        </MainLayout>
        <Toaster />
      </AuthProvider>
    </div>
  );
}
