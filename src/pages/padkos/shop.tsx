import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

import { PadkosSeo } from "@/components/padkos/PadkosSeo";
import { PadkosShell } from "@/components/padkos/PadkosShell";
import { ProductCard } from "@/components/padkos/ProductCard";
import chrome from "@/components/padkos/PadkosChrome.module.css";
import shop from "@/components/padkos/PadkosShop.module.css";
import ui from "@/components/padkos/Padkos.module.css";
import {
  PRODUCTS,
  SHOP_FILTERS,
  type PadkosCategoryKey,
} from "@/lib/padkos/catalog";
import { PADKOS } from "@/lib/padkos/routes";
import { breadcrumbSchema } from "@/lib/padkos/schema";
import { padkosStore, usePadkosWishlist } from "@/lib/padkos/store";

type FilterKey = PadkosCategoryKey | "alle";

/** Per-category SEO so /padkos/shop?regal=… reads like a category page. */
const CATEGORY_SEO: Record<FilterKey, { title: string; description: string }> = {
  alle: {
    title: "Südafrika Shop Österreich – Alle Produkte | Padkos",
    description:
      "Alle südafrikanischen Spezialitäten im Überblick: Biltong, Snacks, Chutney, Rooibos & Braai. Online bestellen – Versand aus Wien in ganz Österreich.",
  },
  biltong: {
    title: "Biltong & Boerewors kaufen – Versand Österreich | Padkos",
    description:
      "Biltong und Boerewors nach traditionellem südafrikanischem Rezept – luftgetrocknet, frisch aus Wien, gekühlter Versand in ganz Österreich.",
  },
  suesses: {
    title: "Südafrikanische Süßigkeiten & Snacks kaufen | Padkos",
    description:
      "Chappies, Ouma Rusks & Co: südafrikanische Süßigkeiten und Snacks online kaufen. Original importiert, Versand aus Wien in ganz Österreich.",
  },
  speisekammer: {
    title: "Mrs Ball's Chutney & mehr – Speisekammer | Padkos",
    description:
      "Mrs Ball's Chutney, All Gold, Gewürze und alles für die südafrikanische Küche. Original aus Südafrika – online bestellen mit Versand in ganz Österreich.",
  },
  getraenke: {
    title: "Rooibos Tee & Amarula kaufen – Getränke | Padkos",
    description:
      "Rooibos Tee, Amarula und südafrikanische Getränke online kaufen. Original importiert, schneller Versand aus Wien in ganz Österreich.",
  },
  braai: {
    title: "Braai-Shop Österreich – Gewürze & Zubehör | Padkos",
    description:
      "Alles fürs Braai: Gewürze, Saucen und Zubehör für den südafrikanischen Grillabend. Online kaufen mit Versand in ganz Österreich.",
  },
  geschenke: {
    title: "Heimweh-Paket – südafrikanische Geschenk-Kiste | Padkos",
    description:
      "Die Geschenk-Kiste gegen Heimweh: sechs südafrikanische Klassiker, verpackt wie ein Packerl von Ouma. Online bestellen, Versand in ganz Österreich.",
  },
};

const VALID_FILTERS = new Set<string>(SHOP_FILTERS.map((f) => f.key));

/** Shop catalogue — `Padkos Shop.dc.html`, plus a search field (best practice). */
export default function PadkosShopPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>("alle");
  const [query, setQuery] = useState("");
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const addedTimer = useRef<ReturnType<typeof setTimeout>>();
  const wishlist = usePadkosWishlist();

  // ?regal= deep link (landing tiles, menu, category links).
  useEffect(() => {
    if (!router.isReady) return;
    const regal = router.query.regal;
    if (typeof regal === "string" && VALID_FILTERS.has(regal)) {
      setFilter(regal as FilterKey);
    }
  }, [router.isReady, router.query.regal]);

  useEffect(() => () => clearTimeout(addedTimer.current), []);

  const selectFilter = (key: FilterKey) => {
    setFilter(key);
    // Keep the URL shareable without triggering a navigation/data fetch.
    const url = key === "alle" ? PADKOS.shop : `${PADKOS.shop}?regal=${key}`;
    void router.replace(url, undefined, { shallow: true, scroll: false });
  };

  const addToCart = (sku: string) => {
    padkosStore.add(sku, 1);
    setJustAdded(sku);
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setJustAdded(null), 1400);
  };

  const q = query.trim().toLowerCase();
  const items = PRODUCTS.filter((p) => filter === "alle" || p.catKey === filter).filter(
    (p) =>
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sub.toLowerCase().includes(q) ||
      p.cat.toLowerCase().includes(q)
  );

  const seo = CATEGORY_SEO[filter];

  return (
    <PadkosShell>
      <PadkosSeo
        title={seo.title}
        description={seo.description}
        path={PADKOS.shop}
        jsonLd={[
          breadcrumbSchema([
            { name: "Padkos", path: PADKOS.home },
            { name: "Shop", path: PADKOS.shop },
          ]),
        ]}
      />

      <div className={chrome.pageBody}>
        <h1 className={chrome.pageTitle}>Der Laden</h1>
        <p className={chrome.pageSub}>
          Alles für die Padkos-Speisekammer – direkt importiert, wie am Straßenrand der R62.
        </p>

        <div className={chrome.chipRow}>
          {SHOP_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => selectFilter(key)}
              aria-pressed={filter === key}
              className={`${chrome.chip}${filter === key ? ` ${chrome.chipActive}` : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={shop.searchWrap}>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Im Laden suchen … (z. B. Biltong)"
            aria-label="Produkte durchsuchen"
            className={chrome.input}
          />
        </div>

        <p className={shop.countLabel} aria-live="polite">
          {items.length} {items.length === 1 ? "PRODUKT" : "PRODUKTE"}
        </p>

        <div className={shop.productGrid}>
          {items.map((product) => (
            <ProductCard
              key={product.sku}
              product={product}
              justAdded={justAdded === product.sku}
              onAdd={() => addToCart(product.sku)}
              wished={wishlist.includes(product.sku)}
              onToggleWish={() => padkosStore.toggleWish(product.sku)}
            />
          ))}
        </div>

        <div className={shop.wishCta}>
          <div className={shop.wishCtaText}>
            <h2>Nichts für dich dabei?</h2>
            <p>
              Schreib uns, was dir aus der Heimat fehlt – wir nehmen Wünsche in die nächste
              Bestellung auf.
            </p>
          </div>
          <Link
            href={PADKOS.kontakt}
            className={`${ui.btn} ${ui.btnGreen} ${ui.shadowMd} ${shop.wishCtaButton}`}
          >
            Produkt wünschen
          </Link>
        </div>
      </div>
    </PadkosShell>
  );
}
