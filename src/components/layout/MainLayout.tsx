import dynamic from 'next/dynamic';
import Header from "@/components/buyauto/Header";

// Dynamically import Footer with ssr: false to prevent hydration mismatches
// and improve initial page load speed (TBT/LCP).
// The SEO impact is minimal as primary navigation is in the Header.
const Footer = dynamic(() => import("@/components/buyauto/Footer").then(mod => mod.Footer), {
  ssr: false,
  loading: () => <div className="h-64 bg-neutral-50" />
});

// CookieConsent is purely client-side interaction
const CookieConsent = dynamic(() => import("@/components/buyauto/CookieConsent").then(mod => mod.CookieConsent), {
  ssr: false
});

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <Header />
      <main>
        {children}
      </main>
      <Footer />
      <CookieConsent />
    </>
  );
}