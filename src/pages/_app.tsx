import type { AppProps } from "next/app";
import MainLayout from "@/components/layout/MainLayout";
import AuthProvider from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="overflow-x-hidden min-h-screen">
      <AuthProvider>
        <MainLayout>
          <Component {...pageProps} />
        </MainLayout>
        <Toaster />
      </AuthProvider>
    </div>
  );
}
