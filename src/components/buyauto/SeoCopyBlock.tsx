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
          Auto-Leasing Übernehmen oder Verkaufen in der Schweiz
        </h2>
        
        <div className="prose prose-lg max-w-none text-gray-700">
          <p className="mb-4">
            BuyAuto.ch ist die führende Plattform für Leasingübernahmen in der Schweiz.
            Wir bringen Menschen zusammen, die ihr Auto-Leasing vorzeitig beenden möchten, mit Interessenten, die von attraktiven Leasingkonditionen profitieren wollen.
            Unser Ziel: Auto-Leasing einfacher, sicherer und transparenter zu machen – schweizweit, von Zürich bis Basel.
          </p>

          {isExpanded && (
            <>
              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Wie funktioniert eine Leasingübernahme?
              </h3>
              
              <p className="mb-4">
                Eine Leasingübernahme bedeutet, dass Sie einen bestehenden Leasingvertrag übernehmen, statt ein neues Leasing abzuschliessen.
                Das spart Zeit, Geld und vermeidet lange Vertragsbindungen.
                Auf BuyAuto.ch finden Sie gepflegte Fahrzeuge mit kurzer Restlaufzeit und attraktiven Monatsraten – oft deutlich günstiger als ein Neuleasing.
              </p>

              <p className="mb-4">
                Für Verkäufer ist es die einfache Lösung, einen laufenden Vertrag ohne hohe Kosten oder Strafgebühren zu übertragen.
                Sie inserieren Ihr Auto, erreichen gezielt interessierte Käufer und geben Ihren Vertrag stressfrei ab.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Vorteile für Käufer
              </h3>
              
              <p className="mb-4">
                <strong>Bessere Konditionen:</strong> Profitieren Sie von bereits ausgehandelten Leasingverträgen.
              </p>

              <p className="mb-4">
                <strong>Kurze Laufzeiten:</strong> Ideal, wenn Sie flexibel bleiben möchten.
              </p>

              <p className="mb-4">
                <strong>Transparente Informationen:</strong> Alle Fahrzeug- und Vertragsdetails sind klar ersichtlich.
              </p>

              <p className="mb-4">
                <strong>Keine hohen Anzahlungen:</strong> Steigen Sie direkt in den bestehenden Vertrag ein.
              </p>

              <p className="mb-4">
                Entdecken Sie alle verfügbaren Fahrzeuge hier: <Link href="/suche" className="text-red-600 hover:text-red-700 font-semibold underline">Fahrzeuge durchsuchen</Link>
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Vorteile für Verkäufer
              </h3>
              
              <p className="mb-4">
                <strong>Schnelle Abwicklung:</strong> Finden Sie unkompliziert einen Nachfolger für Ihren Vertrag.
              </p>

              <p className="mb-4">
                <strong>Einfache Inseratserstellung:</strong> Fotos hochladen, Konditionen angeben, fertig.
              </p>

              <p className="mb-4">
                <strong>Direkter Kontakt:</strong> Interessenten schreiben Sie direkt über die Plattform an.
              </p>

              <p className="mb-4">
                <strong>Flexibilität:</strong> Lösen Sie Ihren Vertrag, wenn sich Ihre Lebensumstände ändern.
              </p>

              <p className="mb-4">
                Jetzt starten: <Link href="/inserat-erstellen" className="text-red-600 hover:text-red-700 font-semibold underline">Inserat erstellen</Link>
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Sicherer Prozess mit Schweizer Standards
              </h3>
              
              <p className="mb-4">
                Bei BuyAuto.ch steht Sicherheit an erster Stelle.
                Alle Zahlungen werden über Stripe abgewickelt – eine der sichersten Zahlungsplattformen der Welt.
                Ihre Daten werden in der Schweiz gehostet und nach den strengsten Datenschutzrichtlinien (DSG und GDPR) verarbeitet.
              </p>

              <p className="mb-4">
                Unser transparenter Prozess garantiert, dass Käufer und Verkäufer jederzeit den Überblick behalten – von der Inseratserstellung bis zur Vertragsübernahme.
                Keine versteckten Kosten, keine bösen Überraschungen.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Warum BuyAuto.ch?
              </h3>
              
              <p className="mb-4">
                🇨🇭 100 % Schweizer Plattform
              </p>

              <p className="mb-4">
                🔒 Sichere Online-Zahlungen via Stripe
              </p>

              <p className="mb-4">
                💬 Direkte Kommunikation zwischen Käufer und Verkäufer
              </p>

              <p className="mb-4">
                ⚙️ Intuitive Benutzeroberfläche und laufende Weiterentwicklung
              </p>

              <p className="mb-4">
                👩‍💻 Schweizer Support-Team, das Ihnen persönlich hilft
              </p>

              <p className="mb-4">
                BuyAuto.ch kombiniert Benutzerfreundlichkeit, Sicherheit und Schweizer Präzision.
                Ob Sie Ihr Auto-Leasing übernehmen oder verkaufen möchten – wir sind Ihre erste Adresse für Leasingübernahmen in der Schweiz.
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