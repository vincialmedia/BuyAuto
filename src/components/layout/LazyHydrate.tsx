"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Server-renders children normally but defers React hydration of the subtree
 * until it approaches the viewport.
 *
 * Why: the homepage ships ~118 KB of server HTML and React re-renders all of
 * it during hydration — on a throttled mobile CPU that main-thread work is
 * what delays the LCP paint (the hero image sits downloaded and unpainted).
 * Sections far below the fold don't need interactivity at load time.
 *
 * SEO invariants (the reason this wrapper is safe):
 * - The SERVER HTML IS UNCHANGED: children render on the server exactly as
 *   without the wrapper (one neutral <div> around them). Crawlers parsing the
 *   HTML see identical content, headings, and links.
 * - Pre-hydration, React is told the subtree is `dangerouslySetInnerHTML`
 *   content, which makes hydration adopt the existing server DOM without
 *   touching it — the content never leaves the page.
 * - When the section nears the viewport (or immediately in environments
 *   without IntersectionObserver — including Googlebot's tall-viewport
 *   renderer, where the observer fires for the whole page at once), the real
 *   children render and take over. Until then, plain links inside still
 *   navigate natively.
 *
 * Only wrap sections whose render is deterministic from props: on hydration
 * handover React re-renders the subtree fresh, so content must come out
 * identical (no Date.now()/random-driven markup).
 */
export function LazyHydrate({
  children,
  /** Start hydrating this far before the section scrolls into view. */
  rootMargin = "600px",
}: {
  children: ReactNode;
  rootMargin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setHydrated(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setHydrated(true);
          io.disconnect();
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hydrated, rootMargin]);

  if (typeof window === "undefined" || hydrated) {
    return <div ref={ref}>{children}</div>;
  }

  // Client render before hydration handover: presenting the subtree as
  // innerHTML content makes React skip it during hydration and leave the
  // server-rendered DOM exactly as delivered.
  return (
    <div
      ref={ref}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: "" }}
    />
  );
}
