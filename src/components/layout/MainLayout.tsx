import dynamic from 'next/dynamic';
import Header from "@/components/buyauto/Header";
// Footer is SSR-safe (year is gated via useHasMounted) — render it statically
// so footer links are in the server HTML for SEO and there is no post-hydration
// layout jump from the placeholder swap.
import { Footer } from "@/components/buyauto/Footer";

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