import dynamic from 'next/dynamic';
import { useRouter } from "next/router";
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
  const router = useRouter();

  // Embed routes are iframed on third-party sites and must be chrome-free — no
  // site header, footer, cookie banner, or wrapping <main> (the embed page
  // renders its own). Everything else gets the full layout. Match the /embed
  // segment exactly (not a greedy prefix like "/embedded-...").
  if (router.pathname === "/embed" || router.pathname.startsWith("/embed/")) {
    return <>{children}</>;
  }

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