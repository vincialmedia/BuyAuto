import Link from "next/link";

import { PadkosSeo } from "@/components/padkos/PadkosSeo";
import { PadkosShell } from "@/components/padkos/PadkosShell";
import chrome from "@/components/padkos/PadkosChrome.module.css";
import shop from "@/components/padkos/PadkosShop.module.css";
import ui from "@/components/padkos/Padkos.module.css";
import { PADKOS } from "@/lib/padkos/routes";
import { usePadkosLastOrder, type PadkosOrder } from "@/lib/padkos/store";

/**
 * The design ships a demo order so the screen never renders empty — shown when
 * no real order is in localStorage (e.g. direct visits to this URL).
 */
const DEMO_ORDER: PadkosOrder = {
  nr: "PK-73412",
  date: "11. August 2026",
  name: "Anje van der Merwe",
  email: "anje@example.at",
  adresse: "Neubaugasse 12, 1070 Wien",
  versand: "Österreichische Post",
  zahlung: "EPS",
  cooled: false,
  items: [
    { sku: "heimweh", name: "Das Heimweh-Paket", qty: 1, totalF: "€ 49,90" },
    { sku: "biltong", name: "Biltong Original", qty: 2, totalF: "€ 17,80" },
  ],
  subtotalF: "€ 67,70",
  shipF: "Gratis",
  totalF: "€ 67,70",
};

/** Order confirmation — `Padkos Bestellung.dc.html`. */
export default function PadkosBestellungPage() {
  const lastOrder = usePadkosLastOrder();
  const order = lastOrder ?? DEMO_ORDER;
  const firstName = order.name.split(" ")[0] || "Freund";

  return (
    <PadkosShell>
      <PadkosSeo
        title="Bestellbestätigung – Padkos"
        description="Deine Padkos-Bestellung ist eingegangen."
        path={PADKOS.bestellung}
        alwaysNoindex
      />

      <div className={`${chrome.pageBody} ${chrome.pageBodyTight}`}>
        <div className={shop.confirmCard}>
          <div className={shop.confirmHead}>
            <span aria-hidden="true" className={shop.confirmCheck}>
              ✓
            </span>
            <h1 className={shop.confirmTitle}>Thank you, {firstName}!</h1>
            <p className={shop.confirmMeta}>
              Deine Bestellung <strong className={shop.confirmNr}>{order.nr}</strong> vom{" "}
              {order.date} ist eingegangen.
            </p>
          </div>

          <div className={shop.confirmBody}>
            <div>
              {order.items.map((item) => (
                <div key={item.sku} className={shop.confirmLine}>
                  <span className={shop.confirmQty}>{item.qty}×</span>
                  <span className={shop.confirmName}>{item.name}</span>
                  <span className={shop.confirmLineTotal}>{item.totalF}</span>
                </div>
              ))}
            </div>

            <dl className={shop.summaryList} style={{ marginTop: 14 }}>
              <div className={shop.summaryRow}>
                <dt>Zwischensumme</dt>
                <dd>{order.subtotalF}</dd>
              </div>
              {order.rabattF ? (
                <div className={shop.summaryRow}>
                  <dt>Rabatt · WELKOM10</dt>
                  <dd className={shop.discountValue}>{order.rabattF}</dd>
                </div>
              ) : null}
              <div className={shop.summaryRow}>
                <dt>Versand · {order.versand}</dt>
                <dd>{order.shipF}</dd>
              </div>
              <div className={`${shop.summaryRow} ${shop.summaryTotal}`}>
                <dt>Gesamt</dt>
                <dd>{order.totalF}</dd>
              </div>
            </dl>

            <div className={shop.confirmAddress}>
              <p>
                <strong>Lieferung an:</strong> {order.name} · {order.adresse}
                <br />
                <strong>Zahlung:</strong> {order.zahlung} · Bestätigung an {order.email}
              </p>
            </div>

            {order.cooled ? (
              <div className={chrome.coolNote} style={{ marginTop: 12 }}>
                <span aria-hidden="true" className={chrome.coolNoteIcon}>
                  ❄
                </span>
                <p>
                  Dein Packerl enthält gekühlte Ware und geht am nächsten Versandtag (Mo–Mi)
                  raus.
                </p>
              </div>
            ) : null}

            <div className={shop.confirmSteps}>
              <h2>So geht&apos;s weiter</h2>
              <ol>
                <li>
                  <span className={`${shop.stepDot} ${shop.stepDotDone}`}>1</span>
                  <p>
                    <strong>Bestellt</strong> – du bekommst gleich eine E-Mail.
                  </p>
                </li>
                <li>
                  <span className={`${shop.stepDot} ${shop.stepDotActive}`}>2</span>
                  <p>
                    <strong>Verpackt</strong> – Retha packt dein Packerl mit Stroh &amp;
                    Kraftpapier.
                  </p>
                </li>
                <li>
                  <span className={`${shop.stepDot} ${shop.stepDotNext}`}>3</span>
                  <p>
                    <strong>Unterwegs</strong> – Sendungsverfolgung per E-Mail, Lieferung in 1–3
                    Werktagen.
                  </p>
                </li>
              </ol>
            </div>

            <div className={shop.confirmActions}>
              <Link
                href={PADKOS.shop}
                className={`${ui.btn} ${ui.btnGreen} ${ui.shadowMd} ${shop.confirmAction}`}
              >
                Weiter einkaufen
              </Link>
              <Link
                href={PADKOS.konto}
                className={`${ui.btn} ${ui.btnPaper} ${ui.shadowMd} ${shop.confirmAction}`}
              >
                Zu meinen Bestellungen
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PadkosShell>
  );
}
