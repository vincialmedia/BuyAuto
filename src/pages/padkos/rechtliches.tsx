import Link from "next/link";

import { PadkosSeo } from "@/components/padkos/PadkosSeo";
import { PadkosShell } from "@/components/padkos/PadkosShell";
import chrome from "@/components/padkos/PadkosChrome.module.css";
import shop from "@/components/padkos/PadkosShop.module.css";
import { PADKOS } from "@/lib/padkos/routes";

/**
 * Impressum, AGB & Widerruf, Datenschutz — `Padkos Rechtliches.dc.html`.
 *
 * One correction against the design file: its clause 6 pointed users to the
 * EU online-dispute-resolution platform, which was shut down on 20 July 2025
 * and whose link duty was repealed — the clause now states only the
 * Verbraucherschlichtung position. All register numbers are the design's
 * placeholders and are flagged as such on the page.
 */
export default function PadkosRechtlichesPage() {
  return (
    <PadkosShell>
      <PadkosSeo
        title="Impressum, AGB & Datenschutz – Padkos"
        description="Rechtliches zu Padkos: Impressum, Allgemeine Geschäftsbedingungen, Widerrufsrecht und Datenschutzerklärung."
        path={PADKOS.rechtliches}
      />

      <div className={`${chrome.pageBody} ${chrome.pageBodyNarrow}`}>
        <h1 className={chrome.pageTitle}>Rechtliches</h1>

        <nav aria-label="Rechtliche Abschnitte" className={shop.legalNav}>
          <a href="#impressum" className={shop.legalChip}>
            Impressum
          </a>
          <a href="#agb" className={shop.legalChip}>
            AGB &amp; Widerruf
          </a>
          <a href="#datenschutz" className={shop.legalChip}>
            Datenschutz
          </a>
        </nav>

        <section id="impressum" className={shop.infoSection}>
          <h2 className={shop.infoTitle}>Impressum</h2>
          <p className={shop.infoText}>
            Padkos e.U.
            <br />
            Inhaberin: Retha Botha
            <br />
            Neubaugasse 12, 1070 Wien, Österreich
            <br />
            <a href="mailto:hallo@padkos.at">hallo@padkos.at</a> · +43 1 907 12 34
          </p>
          <p className={shop.infoText} style={{ marginTop: 10 }}>
            Firmenbuchnummer: FN 000000x · Firmenbuchgericht: Handelsgericht Wien
            <br />
            UID: ATU00000000 · GISA-Zahl: 00000000 · Mitglied der WKO, Fachgruppe
            Lebensmittelhandel
            <br />
            Gewerbebehörde: Magistratisches Bezirksamt für den 7. Bezirk · Anwendbare
            Rechtsvorschriften: GewO (ris.bka.gv.at)
          </p>
          <p className={shop.infoFine}>
            Musterangaben für das Mockup – vor Launch durch echte Registerdaten ersetzen.
          </p>
        </section>

        <section id="agb" className={shop.infoSection}>
          <h2 className={shop.infoTitle}>AGB &amp; Widerruf</h2>
          <div className={shop.legalBlock}>
            <p>
              <strong>1. Geltung.</strong> Diese Bedingungen gelten für alle Bestellungen über
              padkos.at durch Verbraucher:innen mit Lieferadresse in Österreich.
              Vertragssprache ist Deutsch.
            </p>
            <p>
              <strong>2. Vertragsschluss.</strong> Mit Klick auf „Jetzt kostenpflichtig
              bestellen“ gibst du ein verbindliches Angebot ab; der Vertrag kommt mit unserer
              Bestellbestätigung per E-Mail zustande. Den Vertragstext speichern wir und
              schicken ihn dir mit der Bestätigung.
            </p>
            <p>
              <strong>3. Preise &amp; Zahlung.</strong> Alle Preise inkl. MwSt., zzgl. Versand
              laut <Link href={PADKOS.versand}>Versandübersicht</Link>. Zahlung per EPS, Klarna,
              PayPal oder Kreditkarte.
            </p>
            <p>
              <strong>4. Widerruf.</strong> 14 Tage Widerrufsrecht ab Erhalt der Ware, ohne
              Angabe von Gründen – formlos per E-Mail an{" "}
              <a href="mailto:hallo@padkos.at">hallo@padkos.at</a>. Ausgenommen sind schnell
              verderbliche Waren (§ 18 FAGG), insbesondere gekühlte Produkte wie Boerewors,
              sowie versiegelte Lebensmittel nach Entfernen der Versiegelung. Die Kosten der
              Rücksendung trägst du; Erstattung binnen 14 Tagen nach Eingang der Ware.
            </p>
            <p>
              <strong>5. Gewährleistung.</strong> Es gilt das gesetzliche Gewährleistungsrecht
              (2 Jahre). Transportschäden bitte binnen 48 Stunden mit Foto an{" "}
              <a href="mailto:hallo@padkos.at">hallo@padkos.at</a>.
            </p>
            <p>
              <strong>6. Streitbeilegung.</strong> Wir sind nicht verpflichtet und nicht
              bereit, an Verfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </div>
          <p className={shop.infoFine}>
            Gekürzte Muster-AGB für das Mockup – vor Launch rechtlich prüfen lassen.
          </p>
        </section>

        <section id="datenschutz" className={shop.infoSection}>
          <h2 className={shop.infoTitle}>Datenschutzerklärung</h2>
          <div className={shop.legalBlock}>
            <p>
              <strong>Verantwortliche:</strong> Padkos e.U., Neubaugasse 12, 1070 Wien,{" "}
              <a href="mailto:hallo@padkos.at">hallo@padkos.at</a>.
            </p>
            <p>
              <strong>Welche Daten wir verarbeiten:</strong> Bestell- und Lieferdaten (Name,
              Adresse, E-Mail) zur Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO);
              Newsletter-Daten nur mit Einwilligung (lit. a), jederzeit widerrufbar per
              Abmeldelink.
            </p>
            <p>
              <strong>Weitergabe:</strong> an die Österreichische Post zur Zustellung und an
              unseren Zahlungsdienstleister zur Abwicklung – keine Weitergabe zu Werbezwecken.
            </p>
            <p>
              <strong>Speicherdauer:</strong> Bestelldaten 7 Jahre (§ 132 BAO), Newsletter-Daten
              bis zum Widerruf.
            </p>
            <p>
              <strong>Deine Rechte:</strong> Auskunft, Berichtigung, Löschung, Einschränkung,
              Datenübertragbarkeit, Widerspruch – sowie Beschwerde bei der Datenschutzbehörde
              (dsb.gv.at).
            </p>
          </div>
          <p className={shop.infoFine}>
            Verkürzte Muster-Erklärung für das Mockup – vor Launch vervollständigen.
          </p>
        </section>
      </div>
    </PadkosShell>
  );
}
