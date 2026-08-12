import type { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

import { PadkosPhoto } from "@/components/padkos/PadkosPhoto";
import { PadkosSeo } from "@/components/padkos/PadkosSeo";
import { PadkosShell } from "@/components/padkos/PadkosShell";
import chrome from "@/components/padkos/PadkosChrome.module.css";
import shop from "@/components/padkos/PadkosShop.module.css";
import ui from "@/components/padkos/Padkos.module.css";
import { PRODUCTS, findProduct, fmtEUR } from "@/lib/padkos/catalog";
import { PADKOS } from "@/lib/padkos/routes";
import { breadcrumbSchema, productSchema } from "@/lib/padkos/schema";
import { padkosStore, usePadkosWishlist } from "@/lib/padkos/store";

interface ProduktPageProps {
  sku: string;
}

export const getStaticPaths: GetStaticPaths = () => ({
  paths: PRODUCTS.map((p) => ({ params: { sku: p.sku } })),
  // Unknown SKUs 404 (the Padkos-branded catch-all renders it).
  fallback: false,
});

export const getStaticProps: GetStaticProps<ProduktPageProps> = ({ params }) => {
  const sku = typeof params?.sku === "string" ? params.sku : "";
  if (!findProduct(sku)) return { notFound: true };
  return { props: { sku } };
};

/** Product detail — `Padkos Produkt.dc.html`. */
export default function PadkosProduktPage({ sku }: ProduktPageProps) {
  const product = findProduct(sku)!;
  const router = useRouter();
  const wishlist = usePadkosWishlist();
  const wished = wishlist.includes(product.sku);

  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout>>();

  // Fresh product page → fresh quantity/feedback (client-side navigations
  // between products reuse this component instance).
  useEffect(() => {
    setQty(1);
    setAdded(false);
  }, [product.sku]);

  useEffect(() => () => clearTimeout(addedTimer.current), []);

  // One persistent button for both states: swapping elements would drop
  // keyboard focus and screen readers would never hear the confirmation.
  const handleBuyClick = () => {
    if (added) {
      void router.push(PADKOS.kasse);
      return;
    }
    padkosStore.add(product.sku, qty);
    setAdded(true);
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 2600);
  };

  // "Passt dazu": three other shelf-stable products, as in the design.
  const related = PRODUCTS.filter((p) => p.sku !== product.sku && !p.cooled).slice(0, 3);

  const title = `${product.name} kaufen – ${product.cat} | Padkos`;
  // ≤155 chars: prefix + truncated-at-word-boundary description + fixed tail.
  const tail = " Versand aus Wien, ab 59 € gratis.";
  const prefix = `${product.name} online kaufen: `;
  const budget = 155 - tail.length - prefix.length;
  let descPart = product.desc;
  if (descPart.length > budget) {
    descPart = descPart.slice(0, budget).replace(/\s+\S*$/, "") + " …";
  }
  const description = prefix + descPart + tail;

  return (
    <PadkosShell>
      <PadkosSeo
        title={title}
        description={description}
        path={PADKOS.produkt(product.sku)}
        jsonLd={[
          productSchema(product),
          breadcrumbSchema([
            { name: "Padkos", path: PADKOS.home },
            { name: "Shop", path: PADKOS.shop },
            { name: product.name, path: PADKOS.produkt(product.sku) },
          ]),
        ]}
      />

      <div className={chrome.pageBody}>
        <nav aria-label="Breadcrumb" className={shop.breadcrumb}>
          <Link href={PADKOS.shop}>Shop</Link>
          <span aria-hidden="true">›</span>
          <Link href={PADKOS.shopCategory(product.catKey)}>{product.cat}</Link>
          <span aria-hidden="true">›</span>
          <span className={shop.breadcrumbCurrent}>{product.name}</span>
        </nav>

        <div className={shop.pdpGrid}>
          <div className={shop.pdpMedia}>
            <PadkosPhoto
              alt={product.photoAlt}
              caption={product.photoCaption}
              from={product.photoFrom}
              to={product.photoTo}
              aspectRatio={product.sku === "heimweh" ? "4 / 3" : "4 / 5"}
              className={shop.pdpPhoto}
            />
            <span aria-hidden="true" className={shop.pdpStamp}>
              PROUDLY SOUTH AFRICAN ★
            </span>
          </div>

          <div>
            {product.badge ? <span className={shop.pdpBadge}>{product.badge}</span> : null}
            <h1 className={shop.pdpTitle}>{product.name}</h1>
            <p className={shop.pdpSub}>{product.sub}</p>

            <div className={shop.pdpPriceRow}>
              <span className={shop.pdpPrice}>{fmtEUR(product.price)}</span>
              {product.was ? <span className={shop.pdpWas}>{fmtEUR(product.was)}</span> : null}
              <span className={shop.pdpVat}>
                inkl. MwSt.
                {product.grundpreis ? ` · ${product.grundpreis}` : ""}
              </span>
            </div>

            <p className={shop.pdpDesc}>{product.desc}</p>

            {product.inhalt ? (
              <div className={shop.pdpInhalt}>
                <h2>Das ist drin</h2>
                <ul>
                  {product.inhalt.map((zeile) => (
                    <li key={zeile}>{zeile}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {product.cooled ? (
              <div className={chrome.coolNote} style={{ marginTop: 18 }}>
                <span aria-hidden="true" className={chrome.coolNoteIcon}>
                  ❄
                </span>
                <p>
                  <strong>Gekühlter Versand:</strong> vakuumverpackt mit Kühlakkus, Versand nur
                  Montag bis Mittwoch – nie übers Wochenende unterwegs.
                </p>
              </div>
            ) : null}

            {product.ageRestricted ? (
              <p className={shop.pdpAgeNote}>
                <strong>18+</strong> · Enthält Alkohol ({product.sub}). Abgabe nur an Personen ab
                18 Jahren – die Zustellung erfolgt ausschließlich an Erwachsene.
              </p>
            ) : null}

            <div className={shop.pdpBuyRow}>
              <div className={shop.qtyStepper}>
                <button
                  type="button"
                  onClick={() => setQty((n) => Math.max(1, n - 1))}
                  aria-label="Menge verringern"
                  className={shop.qtyButton}
                >
                  −
                </button>
                <span aria-live="polite" className={shop.qtyValue}>
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((n) => Math.min(20, n + 1))}
                  aria-label="Menge erhöhen"
                  className={shop.qtyButton}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleBuyClick}
                className={`${ui.btn} ${added ? ui.btnGold : ui.btnGreen} ${ui.shadowMd} ${shop.pdpAdd}`}
              >
                <span aria-live="polite">
                  {added ? "✓ Im Warenkorb – zur Kasse" : "In den Warenkorb"}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => padkosStore.toggleWish(product.sku)}
              aria-pressed={wished}
              className={shop.pdpWishButton}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill={wished ? "#C43A26" : "none"}
                stroke="#382A1C"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M12 20s-7-4.6-9.3-8.7C.9 8 2.6 4.5 6 4.5c2.2 0 3.6 1.2 6 3.6 2.4-2.4 3.8-3.6 6-3.6 3.4 0 5.1 3.5 3.3 6.8C19 15.4 12 20 12 20Z" />
              </svg>
              {wished ? "Auf der Merkliste ✓" : "Auf die Merkliste"}
            </button>

            <p className={shop.pdpShipNote}>
              Versand mit der Österreichischen Post · 1–3 Werktage · Ab € 59 versandkostenfrei ·
              Abholung in Wien möglich
            </p>

            <div className={shop.pdpDetails}>
              <details>
                <summary>
                  <h3>Zutaten &amp; Allergene</h3>
                  <span aria-hidden="true" className={shop.pdpDetailsMarker}>
                    +
                  </span>
                </summary>
                <p>
                  Alle Zutaten, Allergene und Nährwerte findest du auf der Originalverpackung –
                  und jederzeit auf Anfrage über unser{" "}
                  <Link href={PADKOS.kontakt}>Kontaktformular</Link>.
                </p>
              </details>
              <details>
                <summary>
                  <h3>Versand &amp; Rückgabe</h3>
                  <span aria-hidden="true" className={shop.pdpDetailsMarker}>
                    +
                  </span>
                </summary>
                <p>
                  Lieferung österreichweit in 1–3 Werktagen, ab € 59 kostenlos. 14 Tage
                  Widerrufsrecht; ausgenommen sind verderbliche und entsiegelte Lebensmittel
                  (§ 18 FAGG) – Details unter{" "}
                  <Link href={PADKOS.versand}>Versand &amp; Retouren</Link>.
                </p>
              </details>
            </div>
          </div>
        </div>

        <section className={shop.pdpSection}>
          <div className={shop.relatedHeading}>
            <span aria-hidden="true" className={ui.rule} />
            <h2>Passt dazu</h2>
            <span aria-hidden="true" className={ui.rule} />
          </div>
          <div className={shop.relatedGrid}>
            {related.map((rel) => (
              <Link key={rel.sku} href={PADKOS.produkt(rel.sku)} className={shop.relatedCard}>
                <span aria-hidden="true" className={shop.relatedInitial}>
                  {rel.name.charAt(0)}
                </span>
                <span className={shop.relatedName}>{rel.name}</span>
                <span className={shop.pricePill}>{fmtEUR(rel.price)}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PadkosShell>
  );
}
