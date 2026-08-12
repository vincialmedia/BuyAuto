import Link from "next/link";
import { useRouter } from "next/router";
import { useState, type FormEvent } from "react";

import { PadkosPhoto } from "@/components/padkos/PadkosPhoto";
import { PadkosSeo } from "@/components/padkos/PadkosSeo";
import { PadkosShell } from "@/components/padkos/PadkosShell";
import chrome from "@/components/padkos/PadkosChrome.module.css";
import shop from "@/components/padkos/PadkosShop.module.css";
import ui from "@/components/padkos/Padkos.module.css";
import { findProduct, fmtEUR, SHIP_COST } from "@/lib/padkos/catalog";
import { submitOrder } from "@/lib/padkos/backend";
import { PADKOS } from "@/lib/padkos/routes";
import { computeTotals, padkosStore, usePadkosCart } from "@/lib/padkos/store";

const PAYMENT_METHODS = ["EPS", "Klarna", "PayPal", "Kreditkarte"] as const;

/**
 * Cart & single-page checkout — `Padkos Kasse.dc.html`.
 *
 * One deviation from the design file, in favour of the shop's own published
 * prices: the Versand page lists "+ € 3,90" for chilled shipping, which the
 * design's checkout never charged. Here the surcharge appears as its own
 * summary line whenever a cooled product ships by post; pickup avoids it, and
 * the €59 threshold waives only the base rate.
 */
export default function PadkosKassePage() {
  const router = useRouter();
  const cart = usePadkosCart();
  const [ship, setShip] = useState<"post" | "abholung">("post");
  const [submitting, setSubmitting] = useState(false);

  const totals = computeTotals(cart, ship);
  const lines = totals.skus.map((sku) => ({ product: findProduct(sku)!, qty: cart[sku] }));
  const progressPct = Math.min(100, (totals.subtotal / 59) * 100);

  const placeOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || lines.length === 0) return;
    setSubmitting(true);

    const f = event.currentTarget.elements as typeof event.currentTarget.elements & {
      vorname: HTMLInputElement;
      nachname: HTMLInputElement;
      email: HTMLInputElement;
      strasse: HTMLInputElement;
      plz: HTMLInputElement;
      ort: HTMLInputElement;
      land: HTMLSelectElement;
      zahlung: RadioNodeList;
    };

    const order = {
      nr: "PK-" + Math.floor(10000 + Math.random() * 89999),
      date: new Date().toLocaleDateString("de-AT", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      name: `${f.vorname.value} ${f.nachname.value}`,
      email: f.email.value,
      adresse: `${f.strasse.value}, ${f.plz.value} ${f.ort.value}`,
      versand: ship === "abholung" ? "Abholung in Wien" : "Österreichische Post",
      zahlung: String(f.zahlung.value),
      cooled: totals.hasCooled,
      items: lines.map(({ product, qty }) => ({
        sku: product.sku,
        name: product.name,
        qty,
        totalF: fmtEUR(product.price * qty),
      })),
      subtotalF: fmtEUR(totals.subtotal),
      shipF: totals.ship === 0 ? "Gratis" : fmtEUR(totals.ship),
      totalF: fmtEUR(totals.total),
    };

    await submitOrder({
      order,
      raw: {
        vorname: f.vorname.value,
        nachname: f.nachname.value,
        email: f.email.value,
        strasse: f.strasse.value,
        plz: f.plz.value,
        ort: f.ort.value,
        land: f.land.value,
        versandart: ship,
        zahlung: String(f.zahlung.value),
        subtotal: totals.subtotal,
        ship: totals.ship,
        total: totals.total,
        items: lines.map(({ product, qty }) => ({
          sku: product.sku,
          qty,
          price: product.price,
        })),
      },
    });

    padkosStore.clearCart();
    void router.push(PADKOS.bestellung);
  };

  return (
    <PadkosShell>
      <PadkosSeo
        title="Warenkorb & Kasse – Padkos"
        description="Dein Padkos-Warenkorb: südafrikanische Lebensmittel bestellen mit Versand in ganz Österreich oder Abholung in Wien."
        path={PADKOS.kasse}
        alwaysNoindex
      />

      <div className={chrome.pageBody}>
        <h1 className={chrome.pageTitle}>Warenkorb &amp; Kasse</h1>

        {lines.length === 0 ? (
          <div className={shop.emptyState}>
            <p className={shop.emptyStateTitle}>Noch alles leer hier.</p>
            <p className={shop.emptyStateText}>
              Der Bakkie wartet – lad ihn voll mit Biltong, Chappies &amp; Co.
            </p>
            <Link
              href={PADKOS.shop}
              className={`${ui.btn} ${ui.btnGreen} ${ui.shadowMd} ${shop.emptyStateButton}`}
            >
              In den Laden
            </Link>
          </div>
        ) : (
          <form onSubmit={placeOrder} className={shop.checkoutGrid}>
            <div className={shop.checkoutColumn}>
              {/* ------------------------------------------------ cart lines */}
              <section className={chrome.panel}>
                <h2 className={chrome.panelTitle} style={{ marginBottom: 4 }}>
                  Dein Packerl
                </h2>
                <div>
                  {lines.map(({ product, qty }) => (
                    <div key={product.sku} className={shop.cartLine}>
                      <div className={shop.cartLineMedia}>
                        <PadkosPhoto
                          alt={product.photoAlt}
                          caption=""
                          from={product.photoFrom}
                          to={product.photoTo}
                          aspectRatio="1 / 1"
                        />
                      </div>
                      <div className={shop.cartLineInfo}>
                        <Link href={PADKOS.produkt(product.sku)} className={shop.cartLineName}>
                          {product.name}
                        </Link>
                        <p className={shop.cartLineSub}>{product.sub}</p>
                        {product.cooled ? (
                          <span className={shop.cooledTag}>❄ GEKÜHLT</span>
                        ) : null}
                      </div>
                      <div className={shop.cartQty}>
                        <button
                          type="button"
                          onClick={() => padkosStore.setQty(product.sku, qty - 1)}
                          aria-label={`Menge von ${product.name} verringern`}
                          className={shop.qtyButton}
                        >
                          −
                        </button>
                        <span className={shop.qtyValue}>{qty}</span>
                        <button
                          type="button"
                          onClick={() => padkosStore.setQty(product.sku, qty + 1)}
                          aria-label={`Menge von ${product.name} erhöhen`}
                          className={shop.qtyButton}
                        >
                          +
                        </button>
                      </div>
                      <span className={shop.cartLineTotal}>{fmtEUR(product.price * qty)}</span>
                      <button
                        type="button"
                        onClick={() => padkosStore.setQty(product.sku, 0)}
                        aria-label={`${product.name} entfernen`}
                        className={shop.cartRemove}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                {totals.hasCooled ? (
                  <div className={chrome.coolNote} style={{ marginTop: 14 }}>
                    <span aria-hidden="true" className={chrome.coolNoteIcon}>
                      ❄
                    </span>
                    <p>
                      <strong>Boerewors ist dabei:</strong> Dein Packerl geht gekühlt Montag bis
                      Mittwoch raus – nie übers Wochenende.
                    </p>
                  </div>
                ) : null}
              </section>

              {/* --------------------------------------------------- address */}
              <section className={chrome.panel}>
                <h2 className={chrome.panelTitle} style={{ marginBottom: 14 }}>
                  Lieferadresse
                </h2>
                <div className={shop.formGrid2}>
                  <input
                    required
                    name="vorname"
                    autoComplete="given-name"
                    placeholder="Vorname"
                    aria-label="Vorname"
                    className={chrome.input}
                  />
                  <input
                    required
                    name="nachname"
                    autoComplete="family-name"
                    placeholder="Nachname"
                    aria-label="Nachname"
                    className={chrome.input}
                  />
                </div>
                <div className={shop.formRow}>
                  <input
                    required
                    type="email"
                    name="email"
                    autoComplete="email"
                    placeholder="E-Mail (für die Bestellbestätigung)"
                    aria-label="E-Mail"
                    className={chrome.input}
                  />
                </div>
                <div className={shop.formRow}>
                  <input
                    required
                    name="strasse"
                    autoComplete="street-address"
                    placeholder="Straße & Hausnummer"
                    aria-label="Straße und Hausnummer"
                    className={chrome.input}
                  />
                </div>
                <div className={shop.formGridPlz}>
                  <input
                    required
                    name="plz"
                    autoComplete="postal-code"
                    inputMode="numeric"
                    pattern="[0-9]{4}"
                    title="Vierstellige österreichische Postleitzahl"
                    placeholder="PLZ"
                    aria-label="Postleitzahl"
                    className={chrome.input}
                  />
                  <input
                    required
                    name="ort"
                    autoComplete="address-level2"
                    placeholder="Ort"
                    aria-label="Ort"
                    className={chrome.input}
                  />
                </div>
                <div className={shop.formRow}>
                  <select name="land" aria-label="Land" defaultValue="Österreich" className={chrome.input}>
                    <option>Österreich</option>
                  </select>
                </div>
              </section>

              {/* -------------------------------------------------- shipping */}
              <section className={chrome.panel}>
                <h2 className={chrome.panelTitle} style={{ marginBottom: 14 }}>
                  Versandart
                </h2>
                <div className={shop.radioStack}>
                  <label className={shop.radioOption}>
                    <input
                      type="radio"
                      name="versand"
                      value="post"
                      checked={ship === "post"}
                      onChange={() => setShip("post")}
                    />
                    <span className={shop.radioLabel}>
                      Österreichische Post
                      <span className={shop.radioDetail}>1–3 Werktage · österreichweit</span>
                    </span>
                    <span className={shop.radioPrice}>
                      {totals.freeShip ? "Gratis" : fmtEUR(SHIP_COST)}
                    </span>
                  </label>
                  <label className={shop.radioOption}>
                    <input
                      type="radio"
                      name="versand"
                      value="abholung"
                      checked={ship === "abholung"}
                      onChange={() => setShip("abholung")}
                    />
                    <span className={shop.radioLabel}>
                      Abholung in Wien
                      <span className={shop.radioDetail}>Neubaugasse 12, 1070 · Mo–Sa</span>
                    </span>
                    <span className={shop.radioPrice}>Gratis</span>
                  </label>
                </div>
              </section>

              {/* --------------------------------------------------- payment */}
              <section className={chrome.panel}>
                <h2 className={chrome.panelTitle} style={{ marginBottom: 14 }}>
                  Zahlung
                </h2>
                <div className={shop.paymentGrid}>
                  {PAYMENT_METHODS.map((method, i) => (
                    <label key={method} className={shop.radioOption}>
                      <input
                        type="radio"
                        name="zahlung"
                        value={method}
                        defaultChecked={i === 0}
                      />
                      <span className={shop.radioLabel}>{method}</span>
                    </label>
                  ))}
                </div>
                {totals.hasAgeRestricted ? (
                  <label className={shop.checkboxLabel} style={{ marginTop: 14 }}>
                    <input required type="checkbox" name="alter" />
                    <span>
                      Ich bestätige, dass ich mindestens 18 Jahre alt bin (der Warenkorb enthält
                      Alkohol – Zustellung nur an Erwachsene).
                    </span>
                  </label>
                ) : null}
              </section>
            </div>

            {/* ------------------------------------------------------ summary */}
            <aside className={shop.summary}>
              <h2 className={shop.summaryTitle}>Zusammenfassung</h2>

              {ship === "post" ? (
                <div style={{ marginTop: 14 }}>
                  <p className={shop.progressLabel}>
                    {totals.freeShip
                      ? "Geschafft! Dein Versand ist gratis."
                      : `Noch ${fmtEUR(totals.missingToFree)} bis zum Gratis-Versand`}
                  </p>
                  <div className={shop.progressTrack}>
                    <div
                      className={shop.progressBar}
                      style={{
                        width: `${progressPct}%`,
                        background: totals.freeShip ? "#007A4D" : "#D9A62E",
                      }}
                    />
                  </div>
                </div>
              ) : null}

              <dl className={shop.summaryList}>
                <div className={shop.summaryRow}>
                  <dt>Zwischensumme</dt>
                  <dd>{fmtEUR(totals.subtotal)}</dd>
                </div>
                <div className={shop.summaryRow}>
                  <dt>Versand</dt>
                  <dd>{totals.baseShip === 0 ? "Gratis" : fmtEUR(totals.baseShip)}</dd>
                </div>
                {totals.cooledShip > 0 ? (
                  <div className={shop.summaryRow}>
                    <dt>Kühlversand ❄</dt>
                    <dd>{fmtEUR(totals.cooledShip)}</dd>
                  </div>
                ) : null}
                <div className={`${shop.summaryRow} ${shop.summaryTotal}`}>
                  <dt>Gesamt</dt>
                  <dd>{fmtEUR(totals.total)}</dd>
                </div>
              </dl>
              <p className={shop.summaryVat}>inkl. MwSt.</p>

              <button
                type="submit"
                disabled={submitting}
                className={`${ui.btn} ${ui.btnGreen} ${ui.shadowMd} ${shop.orderButton}`}
              >
                Jetzt kostenpflichtig bestellen
              </button>
              <p className={shop.summaryLegal}>
                Mit der Bestellung akzeptierst du unsere <Link href={PADKOS.agb}>AGB</Link> und
                hast die <Link href={PADKOS.datenschutz}>Datenschutzerklärung</Link> gelesen.
              </p>
              <p className={shop.summaryDemo}>Demo-Kasse – es wird nichts berechnet.</p>
            </aside>
          </form>
        )}
      </div>
    </PadkosShell>
  );
}
