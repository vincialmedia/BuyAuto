import dynamic from 'next/dynamic';
import { useRouter } from "next/router";
import Header from "@/components/buyauto/Header";
// Footer is SSR-safe (year is gated via useHasMounted) — render it statically
// so footer links are in the server HTML for SEO and there is no post-hydration
// layout jump from the placeholder swap.
import { Footer } from "@/components/buyauto/Footer";
import { isChromeFreeRoute } from "@/lib/routes";

// CookieConsent is purely client-side interaction
const CookieConsent = dynamic(() => import("@/components/buyauto/CookieConsent").then(mod => mod.CookieConsent), {
  ssr: false
});

interface MainLayoutProps {
  children: React.ReactNode;
}

// Focused, multi-step task flows: header (nav, account menu) stays, the footer
// goes. With a footer below it the page was always taller than the viewport, so
// advancing a step left the reader parked at the bottom of the page instead of
// on the step they just opened. Without one the flow can be centred in the
// space under the header and there is nothing to jump to.
const FOCUSED_FLOW_ROUTES = new Set(["/inserat-erstellen"]);

export default function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();

  if (isChromeFreeRoute(router.pathname)) {
    return <>{children}</>;
  }

  if (FOCUSED_FLOW_ROUTES.has(router.pathname)) {
    return (
      <div className="flex min-h-[100svh] flex-col bg-gradient-to-b from-white to-neutral-50">
        <Header />
        {/*
          flex-1 + justify-center, never a fixed height: while the step fits, it
          is centred in the space under the header and the page does not scroll
          at all. A step taller than that space grows <main> instead of
          overflowing it, so the page scrolls normally and nothing is clipped.
        */}
        <main className="flex flex-1 flex-col justify-center">
          {/* The page content stays a normal block box inside the centring
              column. As a bare flex item it would be shrink-to-fit instead,
              which quietly narrows any `mx-auto max-w-*` wrapper the page
              renders (the success screen has one). */}
          <div className="w-full">{children}</div>
        </main>
        <CookieConsent />
      </div>
    );
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