import Header from "@/components/buyauto/Header";
import { Footer } from "@/components/buyauto/Footer";
import dynamic from "next/dynamic";

// Dynamically import client-side only components to reduce initial bundle size
// ssr: false because they rely on localStorage and aren't critical for SEO/LCP
const CookieConsent = dynamic(() => import("@/components/buyauto/CookieConsent").then(mod => mod.CookieConsent), {
  ssr: false
});

const PromoBanner = dynamic(() => import("@/components/buyauto/PromoBanner").then(mod => mod.PromoBanner), {
  ssr: false
});

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <Header />
      <PromoBanner />
      <main>
        {children}
      </main>
      <Footer />
      <CookieConsent />
    </>
  );
}
