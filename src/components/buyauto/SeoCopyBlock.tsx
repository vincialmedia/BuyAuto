
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function SeoCopyBlock() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="bg-gray-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Auto-Leasing Übernehmen oder Abgeben in der Schweiz – schnell & sicher mit BuyAuto.ch
        </h2>
        
        <div className="prose prose-lg max-w-none text-gray-700">
          <p className="mb-4">
            BuyAuto.ch ist die führende Schweizer Plattform für Leasingübernahmen.
            Bei uns finden Sie Privatpersonen, die ihr Auto-Leasing abgeben möchten, und Interessenten, die ein bestehendes Leasing günstig übernehmen wollen – ohne Neuleasing, ohne hohe Anzahlung, ohne lange Vertragsbindung.
          </p>

          <p className="mb-4">
            Wir machen die Leasingübernahme in der Schweiz so einfach wie möglich: transparent, sicher und komplett online.
          </p>

          {isExpanded && (
            <>
              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Was ist eine Leasingübernahme?
              </h3>
              
              <p className="mb-4">
                Bei einer Leasingübernahme übernehmen Sie einen laufenden Leasingvertrag, statt ein neues Leasing abzuschliessen.
                Das bringt klare Vorteile:
              </p>
              
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li><strong>Keine Anzahlung</strong> – Sie steigen direkt in den Vertrag ein.</li>
                <li><strong>Günstigere Monatsraten</strong> – viele Verträge sind subventioniert, weil der Verkäufer schnell aussteigen will.</li>
                <li><strong>Kurze Restlaufzeiten</strong> – perfekt, wenn Sie flexibel bleiben möchten.</li>
              </ul>

              <p className="mb-4">
                Auf BuyAuto.ch finden Sie geprüfte Leasing-Inserate von Privatpersonen mit klaren Vertragsdetails, transparenter Kostenübersicht und sofortiger Verfügbarkeit.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Leasing abgeben in der Schweiz – schnell, stressfrei & ohne hohe Gebühren
              </h3>
              
              <p className="mb-4">
                Viele Menschen möchten ihr Auto-Leasing vorzeitig beenden – wegen Umzug, Familienzuwachs, Jobwechsel oder geänderten Lebensumständen.
              </p>

              <p className="mb-4">
                BuyAuto.ch ist die einfachste Lösung, um Ihr Auto-Leasing ohne Strafgebühren abzugeben:
              </p>

              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li>Inserat in wenigen Minuten erstellen</li>
                <li><strong>Gezielte Reichweite:</strong> Wir sprechen Menschen an, die aktiv ein Auto-Leasing übernehmen möchten.</li>
                <li>Direkter Kontakt zu Interessenten</li>
                <li>Transparenter Prozess, bis der Vertrag offiziell übergeben ist</li>
              </ul>

              <p className="mb-4">
                Damit verkaufen Sie Ihr Auto-Leasing schneller – und günstiger – als auf herkömmlichen Occasion-Portalen.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Vorteile für Käufer
              </h3>
              
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li>Günstige Leasingübernahmen dank motivierter Verkäufer</li>
                <li>Keine hohen Anzahlungen</li>
                <li>Kurze Restlaufzeiten (0–100 Monate)</li>
                <li>Alle Vertragsdetails transparent sichtbar</li>
                <li>Sofort verfügbare Fahrzeuge ohne Lieferzeiten</li>
              </ul>

              <p className="mb-4">
                👉 Jetzt Fahrzeuge entdecken: <Link href="/suche" className="text-red-600 hover:text-red-700 font-semibold underline">Fahrzeuge durchsuchen</Link>
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Vorteile für Verkäufer
              </h3>
              
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li>Leasingvertrag schnell weitergeben</li>
                <li>Mehr Sichtbarkeit als auf gemischten Autoportalen</li>
                <li>Einfaches Inserat mit Fotos & Vertragsdaten</li>
                <li>Direkter Kontakt mit seriösen Interessenten</li>
                <li>Ideal, um Leasing ohne Zusatzkosten abzugeben</li>
              </ul>

              <p className="mb-4">
                👉 Jetzt Inserat erstellen: <Link href="/inserat-erstellen" className="text-red-600 hover:text-red-700 font-semibold underline">Inserat erstellen</Link>
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Sicherer Prozess nach Schweizer Standards
              </h3>
              
              <p className="mb-4">
                BuyAuto.ch setzt auf maximale Sicherheit:
              </p>

              <ul className="list-none pl-0 mb-4 space-y-2">
                <li className="flex items-center gap-2">🔒 Stripe für sichere Online-Zahlungen</li>
                <li className="flex items-center gap-2">🇨🇭 DSG/DSGVO-konforme Datenverarbeitung</li>
                <li className="flex items-center gap-2">🧾 Transparenter Workflow von Inserat bis zur Vertragsübergabe</li>
                <li className="flex items-center gap-2">🚫 Keine versteckten Kosten</li>
              </ul>

              <p className="mb-4">
                Wir sorgen dafür, dass Käufer und Verkäufer jederzeit den Überblick behalten.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Warum BuyAuto.ch?
              </h3>
              
              <ul className="list-none pl-0 mb-4 space-y-2">
                <li className="flex items-center gap-2">🇨🇭 100 % Schweizer Plattform für Leasingübernahmen</li>
                <li className="flex items-center gap-2">🚗 Spezialisierte Leasing-Inserate statt unübersichtliche Occasionen</li>
                <li className="flex items-center gap-2">🔍 Klare Suchfilter für Marke, Modell, Preis, Laufzeit & Monatsrate</li>
                <li className="flex items-center gap-2">💬 Direkte Kommunikation zwischen Käufer und Verkäufer</li>
                <li className="flex items-center gap-2">⚙️ Moderne, intuitive Benutzeroberfläche</li>
              </ul>

              <p className="font-semibold text-gray-900 mt-6">
                BuyAuto.ch macht Leasing übernehmen oder abgeben in der Schweiz so einfach wie noch nie.
              </p>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            {isExpanded ? (
              <>
                Weniger anzeigen <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Mehr erfahren <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
