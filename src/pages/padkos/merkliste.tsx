import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { PadkosSeo } from "@/components/padkos/PadkosSeo";
import { PadkosShell } from "@/components/padkos/PadkosShell";
import { ProductCard } from "@/components/padkos/ProductCard";
import chrome from "@/components/padkos/PadkosChrome.module.css";
import shop from "@/components/padkos/PadkosShop.module.css";
import ui from "@/components/padkos/Padkos.module.css";
import { findProduct, type PadkosProduct } from "@/lib/padkos/catalog";
import { PADKOS } from "@/lib/padkos/routes";
import { padkosStore, usePadkosWishlist } from "@/lib/padkos/store";

/** Wishlist — `Padkos Merkliste.dc.html`. */
export default function PadkosMerklistePage() {
  const wishlist = usePadkosWishlist();
  const items = wishlist
    .map((sku) => findProduct(sku))
    .filter((p): p is PadkosProduct => Boolean(p));

  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [allAdded, setAllAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout>>();
  const allTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(
    () => () => {
      clearTimeout(addedTimer.current);
      clearTimeout(allTimer.current);
    },
    []
  );

  const addToCart = (sku: string) => {
    padkosStore.add(sku, 1);
    setJustAdded(sku);
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setJustAdded(null), 1400);
  };

  const addAll = () => {
    if (!allAdded) {
      for (const product of items) padkosStore.add(product.sku, 1);
    }
    setAllAdded(true);
    clearTimeout(allTimer.current);
    allTimer.current = setTimeout(() => setAllAdded(false), 2200);
  };

  return (
    <PadkosShell>
      <PadkosSeo
        title="Merkliste – Padkos"
        description="Deine gemerkten südafrikanischen Produkte – fürs nächste Packerl vorgemerkt."
        path={PADKOS.merkliste}
        alwaysNoindex
      />

      <div className={chrome.pageBody}>
        <h1 className={chrome.pageTitle}>Deine Merkliste</h1>
        <p className={chrome.pageSub}>Fürs nächste Packerl vorgemerkt.</p>

        {items.length === 0 ? (
          <div className={shop.emptyState}>
            <span aria-hidden="true" className={shop.emptyStateIcon}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#A8987C"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M12 20s-7-4.6-9.3-8.7C.9 8 2.6 4.5 6 4.5c2.2 0 3.6 1.2 6 3.6 2.4-2.4 3.8-3.6 6-3.6 3.4 0 5.1 3.5 3.3 6.8C19 15.4 12 20 12 20Z" />
              </svg>
            </span>
            <p className={shop.emptyStateTitle} style={{ marginTop: 14 }}>
              Noch nichts gemerkt.
            </p>
            <p className={shop.emptyStateText}>
              Tipp aufs Herz bei einem Produkt – dann wartet es hier auf dich.
            </p>
            <Link
              href={PADKOS.shop}
              className={`${ui.btn} ${ui.btnGreen} ${ui.shadowMd} ${shop.emptyStateButton}`}
            >
              In den Laden
            </Link>
          </div>
        ) : (
          <>
            <div className={shop.productGrid} style={{ marginTop: 20 }}>
              {items.map((product) => (
                <ProductCard
                  key={product.sku}
                  product={product}
                  justAdded={justAdded === product.sku}
                  onAdd={() => addToCart(product.sku)}
                  wished
                  onToggleWish={() => padkosStore.toggleWish(product.sku)}
                  wishLabel="Von der Merkliste entfernen"
                />
              ))}
            </div>

            <div className={shop.wishActions}>
              <button
                type="button"
                onClick={addAll}
                className={`${ui.btn} ${ui.btnGreen} ${ui.shadowMd} ${shop.wishActionButton}`}
              >
                {allAdded ? "✓ Alles im Warenkorb" : "Alles in den Warenkorb"}
              </button>
              <Link
                href={PADKOS.shop}
                className={`${ui.btn} ${ui.btnPaper} ${ui.shadowMd} ${shop.wishActionButton}`}
              >
                Weiter stöbern
              </Link>
            </div>
          </>
        )}
      </div>
    </PadkosShell>
  );
}
