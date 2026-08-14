import type { GetServerSideProps } from "next";
import Head from "next/head";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/integrations/supabase/client";
import { getPublicGarageBySlug } from "@/services/garageService";
import { EmbedLockedNotice } from "@/components/buyauto/dealer/EmbedLockedNotice";

// Client-only chunk, same as the public page.
const EintauschwertRechner = dynamic(
  () =>
    import("@/components/buyauto/calculator/EintauschwertRechner").then(
      (mod) => mod.EintauschwertRechner
    ),
  { ssr: false }
);

type PageProps =
  | { status: "ok" }
  | { status: "locked"; garageName: string | null }
  | { status: "missing_garage" };

/**
 * The widget is a Growth+ website tool, so the iframe must identify which
 * garage embedded it (`?garage=<profil-slug>`) and that garage's package must
 * include the website tools. Before this the page was anonymous and public —
 * the pricing fence existed only in the dashboard UI. Fails OPEN on transient
 * errors so a paying dealer's website never goes blank because of us.
 */
export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const raw = ctx.query.garage;
  const slug = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  if (!slug) return { props: { status: "missing_garage" } };

  try {
    const garage = await getPublicGarageBySlug(slug);
    if (!garage) return { props: { status: "missing_garage" } };

    const { data, error } = await supabase.rpc("get_garage_website_tools_enabled", {
      p_garage_id: garage.id,
    });
    if (error) throw error;

    if (data === false) {
      return { props: { status: "locked", garageName: garage.garage_name ?? null } };
    }
    return { props: { status: "ok" } };
  } catch (e) {
    console.error("calculator embed: website-tools check failed, failing open", e);
    return { props: { status: "ok" } };
  }
};

// Standalone, chrome-free embed of the Eintauschwert-Rechner for iframing on a
// garage's own website. Posts its height to the parent so the host iframe can
// auto-size (same "buyauto:resize" protocol as the dealer-inventory embed).
export default function EintauschwertRechnerEmbed(props: PageProps) {
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

  if (props.status === "locked") {
    return <EmbedLockedNotice garageName={props.garageName} />;
  }

  if (props.status === "missing_garage") {
    return (
      <>
        <Head>
          <title>Eintauschwert-Rechner</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <main className="min-h-[200px] bg-white">
          <div className="mx-auto max-w-xl px-4 py-10 text-center">
            <p className="text-sm font-semibold text-neutral-900">Widget nicht konfiguriert</p>
            <p className="mt-2 text-sm text-neutral-600">
              Dem Embed fehlt der Parameter <span className="font-mono">?garage=&lt;dein-slug&gt;</span>.
              Den fertigen Code findest du im Garage-Dashboard unter «Rechner».
            </p>
          </div>
        </main>
      </>
    );
  }

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
