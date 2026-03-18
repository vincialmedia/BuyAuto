import type { GetServerSideProps } from "next";
import { SEO } from "@/components/SEO";
import { getPublicGarageBySlug } from "@/services/garageService";
import { PublicDealerInventory } from "@/components/buyauto/dealer/PublicDealerInventory";

type PublicGarage = NonNullable<Awaited<ReturnType<typeof getPublicGarageBySlug>>>;

type PageProps =
  | {
      ok: true;
      garage: PublicGarage;
      absoluteUrl: string;
      initialQuery: Record<string, string | number | boolean>;
    }
  | {
      ok: false;
    };

function parseNumber(value: string | string[] | undefined): number | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function parseString(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v?.trim() ? v.trim() : undefined;
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const dealerSlugRaw = ctx.params?.dealerSlug;
  const dealerSlug = typeof dealerSlugRaw === "string" ? dealerSlugRaw : null;

  if (!dealerSlug) return { props: { ok: false } };

  try {
    const garage = await getPublicGarageBySlug(dealerSlug);
    if (!garage || !garage.slug) return { notFound: true };

    const base =
      (process.env.NEXT_PUBLIC_SITE_URL || "").trim() ||
      (process.env.NODE_ENV === "production" ? "https://www.buyauto.ch" : "http://localhost:3000");

    const absoluteUrl = `${base.replace(/\/$/, "")}/embed/garage/${garage.slug}`;

    const initialQuery: Record<string, string | number | boolean> = {};
    const saleType = parseString(ctx.query.saleType);
    const yearMin = parseNumber(ctx.query.yearMin);
    const priceMin = parseNumber(ctx.query.priceMin);
    const priceMax = parseNumber(ctx.query.priceMax);
    const monthsMax = parseNumber(ctx.query.monthsMax);
    const sort = parseString(ctx.query.sort);

    if (saleType) initialQuery.saleType = saleType;
    if (typeof yearMin === "number") initialQuery.yearMin = yearMin;
    if (typeof priceMin === "number") initialQuery.priceMin = priceMin;
    if (typeof priceMax === "number") initialQuery.priceMax = priceMax;
    if (typeof monthsMax === "number") initialQuery.monthsMax = monthsMax;
    if (sort) initialQuery.sort = sort;

    return {
      props: {
        ok: true,
        garage,
        absoluteUrl,
        initialQuery,
      },
    };
  } catch {
    return { props: { ok: false } };
  }
};

export default function DealerInventoryEmbedPage(props: PageProps) {
  if (!props.ok) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-sm text-neutral-600">Embed nicht verfügbar.</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <SEO
        title={`${props.garage.garage_name} – Fahrzeuge | BuyAuto`}
        description="Fahrzeuge auf BuyAuto"
        url={props.absoluteUrl}
      />
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
          <PublicDealerInventory garageId={props.garage.id} initialQuery={props.initialQuery} className="shadow-none" />
        </div>

        <div className="px-3 pb-6">
          <div className="mx-auto max-w-6xl">
            <details className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
              <summary className="cursor-pointer select-none font-medium text-neutral-900">
                Embed-Code (Auto-Höhe)
              </summary>
              <div className="mt-3 space-y-3">
                <p className="text-neutral-600">
                  Füge diesen Code auf deiner Website ein. Er passt die Höhe automatisch an (mobilfreundlich).
                </p>
                <pre className="overflow-x-auto rounded-xl bg-neutral-950 p-4 text-xs text-white">
{`<iframe
  id="buyauto-dealer-inventory"
  src="${props.absoluteUrl}"
  style="width:100%;border:0;display:block;"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade"
></iframe>
<script>
  (function () {
    var iframe = document.getElementById("buyauto-dealer-inventory");
    if (!iframe) return;
    function onMessage(event) {
      if (!event || !event.data) return;
      if (event.data.type !== "BUY_AUTO_IFRAME_HEIGHT") return;
      if (typeof event.data.height !== "number") return;
      iframe.style.height = event.data.height + "px";
    }
    window.addEventListener("message", onMessage, false);
  })();
</script>`}
                </pre>
              </div>
            </details>
          </div>
        </div>
      </main>
    </>
  );
}