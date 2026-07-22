import Head from "next/head";
import { useEffect } from "react";
import dynamic from "next/dynamic";

// Client-only chunk, same as the public page.
const EintauschwertRechner = dynamic(
  () =>
    import("@/components/buyauto/calculator/EintauschwertRechner").then(
      (mod) => mod.EintauschwertRechner
    ),
  { ssr: false }
);

// Standalone, chrome-free embed of the Eintauschwert-Rechner for iframing on a
// garage's own website. Posts its height to the parent so the host iframe can
// auto-size (same "buyauto:resize" protocol as the dealer-inventory embed).
export default function EintauschwertRechnerEmbed() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const embedId = params.get("embedId") || "buyauto-eintauschwert-rechner";

    let lastHeight = 0;
    const postHeight = () => {
      const h = Math.ceil(document.documentElement.scrollHeight);
      if (h === lastHeight) return;
      lastHeight = h;
      window.parent?.postMessage({ type: "buyauto:resize", id: embedId, height: h }, "*");
    };

    postHeight();
    const ro = new ResizeObserver(() => postHeight());
    ro.observe(document.body);
    window.addEventListener("load", postHeight);
    const interval = window.setInterval(postHeight, 1000);

    return () => {
      ro.disconnect();
      window.removeEventListener("load", postHeight);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <>
      <Head>
        <title>Eintauschwert-Rechner</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <main className="bg-white">
        <div className="mx-auto max-w-5xl px-3 py-5 sm:px-4">
          <EintauschwertRechner />
          <p className="mt-6 text-center text-xs text-neutral-400">
            Rechner von{" "}
            <a
              href="https://www.buyauto.ch/eintauschwert-rechner"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-neutral-500 hover:text-red-600"
            >
              BuyAuto.ch
            </a>
          </p>
        </div>
      </main>
    </>
  );
}
