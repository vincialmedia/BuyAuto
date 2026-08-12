import Link from "next/link";

import { PadkosSeo } from "@/components/padkos/PadkosSeo";
import { PadkosShell } from "@/components/padkos/PadkosShell";
import chrome from "@/components/padkos/PadkosChrome.module.css";
import shop from "@/components/padkos/PadkosShop.module.css";
import { PADKOS } from "@/lib/padkos/routes";

/** Shipping & returns — `Padkos Versand.dc.html`. */
export default function PadkosVersandPage() {
  return (
    <PadkosShell>
      <PadkosSeo
        title="Versand & Lieferung in ganz Österreich | Padkos"
        description="Versandkosten & Lieferzeiten: Zustellung österreichweit in 1–3 Werktagen, ab 59 € gratis. Gekühlter Versand für frisches Biltong und Boerewors."
        path={PADKOS.versand}
      />

      <div className={`${chrome.pageBody} ${chrome.pageBodyNarrow}`}>
        <h1 className={chrome.pageTitle}>Versand &amp; Retouren</h1>
        <p className={chrome.pageSub}>
          Vom Regal in Wien bis vor deine Tür – so kommt dein Packerl an.
        </p>

        <section className={shop.infoSection}>
          <h2 className={shop.infoTitle}>Versandkosten</h2>
          <div className={shop.priceTable}>
            <div className={shop.priceRow}>
              <span className={shop.priceRowName}>Österreich · Post</span>
              <span className={shop.priceRowDetail}>1–3 Werktage</span>
              <span className={shop.priceRowValue}>€ 4,90</span>
            </div>
            <div className={shop.priceRow}>
              <span className={shop.priceRowName}>Österreich · ab € 59</span>
              <span className={shop.priceRowDetail}>1–3 Werktage</span>
              <span className={shop.priceRowValue}>Gratis</span>
            </div>
            <div className={shop.priceRow}>
              <span className={shop.priceRowName}>Gekühlter Versand (Boerewors)</span>
              <span className={shop.priceRowDetail}>Versand Mo–Mi</span>
              <span className={shop.priceRowValue}>+ € 3,90</span>
            </div>
            <div className={shop.priceRow}>
              <span className={shop.priceRowName}>Abholung in Wien</span>
              <span className={shop.priceRowDetail}>Neubaugasse 12, 1070 · Mo–Sa</span>
              <span className={shop.priceRowValue}>Gratis</span>
            </div>
          </div>
        </section>

        <section className={shop.coolSection}>
          <h2>❄ So reist die Boerewors</h2>
          <ol className={shop.coolSteps}>
            <li>
              <span className={`${shop.stepDot} ${shop.stepDotDone}`}>1</span>
              <p>
                <strong>Vakuumverpackt &amp; tiefgekühlt</strong> – direkt aus der Kühlkette in
                die isolierte Box mit Kühlakkus.
              </p>
            </li>
            <li>
              <span className={`${shop.stepDot} ${shop.stepDotDone}`}>2</span>
              <p>
                <strong>Versand nur Montag bis Mittwoch</strong> – dein Packerl liegt nie übers
                Wochenende im Depot.
              </p>
            </li>
            <li>
              <span className={`${shop.stepDot} ${shop.stepDotDone}`}>3</span>
              <p>
                <strong>Ankunft in 1–2 Werktagen</strong> – auspacken, einfrieren oder gleich auf
                den Braai damit.
              </p>
            </li>
          </ol>
        </section>

        <section className={shop.infoSection}>
          <h2 className={shop.infoTitle}>Retouren &amp; Widerruf</h2>
          <p className={shop.infoText}>
            Du kannst deine Bestellung innerhalb von <strong>14 Tagen</strong> ohne Angabe von
            Gründen widerrufen – bei ungeöffneter, originalverpackter Ware. Ausgenommen sind
            gekühlte und leicht verderbliche Produkte (z. B. Boerewors) sowie geöffnete
            Lebensmittel.
          </p>
          <p className={shop.infoText} style={{ marginTop: 10 }}>
            So geht&apos;s: kurze E-Mail an{" "}
            <a href="mailto:hallo@padkos.at">hallo@padkos.at</a> mit deiner Bestellnummer – wir
            schicken dir das Retourenlabel. Erstattung innerhalb von 14 Tagen nach Eingang.
            Details in den <Link href={PADKOS.agb}>AGB</Link>.
          </p>
        </section>

        <section className={shop.hintStrip}>
          <p>
            <strong>Etwas kaputt angekommen?</strong> Foto schicken, wir ersetzen sofort.
          </p>
          <Link href={PADKOS.kontakt} className={shop.hintLink}>
            Zum Kontaktformular →
          </Link>
        </section>
      </div>
    </PadkosShell>
  );
}
