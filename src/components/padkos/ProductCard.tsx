import Link from "next/link";

import type { PadkosProduct } from "@/lib/padkos/catalog";
import { fmtEUR } from "@/lib/padkos/catalog";
import { PADKOS } from "@/lib/padkos/routes";

import { PadkosPhoto } from "./PadkosPhoto";
import styles from "./PadkosShop.module.css";
import ui from "./Padkos.module.css";

interface ProductCardProps {
  product: PadkosProduct;
  /** Cart feedback: this card just fired an add, show "✓ Dazugelegt". */
  justAdded: boolean;
  onAdd: () => void;
  /** Wishlist heart. On the Merkliste the heart becomes the remove control. */
  wished: boolean;
  onToggleWish: () => void;
  wishLabel?: string;
}

/**
 * The catalogue card used by the shop grid and the wishlist: badge, heart,
 * tinted photo slot, price (+ Grundpreis) and an add-to-cart button that
 * flips to "✓ Dazugelegt" for 1.4s after adding — exactly the design's
 * feedback loop.
 */
export function ProductCard({
  product,
  justAdded,
  onAdd,
  wished,
  onToggleWish,
  wishLabel = "Auf die Merkliste",
}: ProductCardProps) {
  const href = PADKOS.produkt(product.sku);
  return (
    <article className={styles.card}>
      <div className={styles.cardInner}>
        <div className={styles.cardMedia}>
          {product.badge ? <span className={styles.cardBadge}>{product.badge}</span> : null}
          <Link href={href} tabIndex={-1} aria-hidden="true">
            <PadkosPhoto
              alt={product.photoAlt}
              caption={product.photoCaption}
              from={product.photoFrom}
              to={product.photoTo}
            />
          </Link>
          <button
            type="button"
            onClick={onToggleWish}
            aria-label={`${product.name}: ${wishLabel}`}
            aria-pressed={wished}
            className={styles.heartButton}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill={wished ? "#C43A26" : "none"}
              stroke="#382A1C"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <path d="M12 20s-7-4.6-9.3-8.7C.9 8 2.6 4.5 6 4.5c2.2 0 3.6 1.2 6 3.6 2.4-2.4 3.8-3.6 6-3.6 3.4 0 5.1 3.5 3.3 6.8C19 15.4 12 20 12 20Z" />
            </svg>
          </button>
        </div>
        <h3 className={styles.cardName}>
          <Link href={href}>{product.name}</Link>
        </h3>
        <p className={styles.cardSub}>{product.sub}</p>
        <div className={styles.cardPriceRow}>
          <span className={styles.pricePill}>{fmtEUR(product.price)}</span>
          {product.was ? <span className={styles.priceWas}>{fmtEUR(product.was)}</span> : null}
        </div>
        {product.grundpreis ? (
          <p className={styles.cardGrundpreis}>{product.grundpreis}</p>
        ) : null}
        {/* One persistent, always-enabled element: a disabled swap would drop
            keyboard focus and screen readers would miss the confirmation. */}
        <button
          type="button"
          onClick={() => {
            if (!justAdded) onAdd();
          }}
          aria-label={`${product.name}: In den Warenkorb`}
          className={
            justAdded
              ? styles.cardButtonAdded
              : `${ui.btn} ${ui.btnGreen} ${ui.shadowSm} ${styles.cardButton}`
          }
        >
          <span aria-live="polite">{justAdded ? "✓ Dazugelegt" : "In den Warenkorb"}</span>
        </button>
      </div>
    </article>
  );
}
