import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SeoCopyBlock() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="bg-gray-50 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">
          Über BuyAuto.ch
        </h2>
        
        <div className="prose prose-lg max-w-none text-gray-700">
          <p className="mb-4">
            BuyAuto.ch ist die führende Plattform für <strong>Leasingübernahmen in der Schweiz</strong>. 
            Wir verbinden Personen, die ihr Auto-Leasing vorzeitig beenden möchten, mit interessierten 
            Käufern, die von attraktiven Leasingkonditionen profitieren wollen. Unsere Plattform macht 
            den Prozess der Leasingübernahme <strong>transparent, sicher und unkompliziert</strong>.
          </p>

          <p className="mb-4">
            Eine Leasingübernahme bietet zahlreiche Vorteile: Sie können ein gepflegtes Fahrzeug mit 
            kurzer Restlaufzeit übernehmen, ohne lange Vertragsbindung eingehen zu müssen. Gleichzeitig 
            profitieren Sie oft von <strong>günstigeren monatlichen Raten</strong> als bei einem Neuleasing. 
            Für Verkäufer bedeutet BuyAuto.ch die Möglichkeit, sich flexibel und ohne hohe Kosten aus 
            einem bestehenden Leasingvertrag zu lösen.
          </p>

          {isExpanded && (
            <>
              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Sicherer und transparenter Prozess
              </h3>
              
              <p className="mb-4">
                Bei BuyAuto.ch steht <strong>Sicherheit an erster Stelle</strong>. Alle Zahlungen werden 
                über die renommierte Zahlungsplattform Stripe abgewickelt, die höchste Sicherheitsstandards 
                garantiert. Ihre sensiblen Daten werden auf Schweizer Servern gehostet und nach den 
                strengsten Datenschutzrichtlinien behandelt.
              </p>

              <p className="mb-4">
                Unser transparenter Prozess sorgt dafür, dass beide Parteien – Käufer und Verkäufer – 
                jederzeit den Überblick behalten. Von der Inseratserstellung über die Kontaktaufnahme 
                bis hin zur finalen Vertragsübernahme begleiten wir Sie Schritt für Schritt. Detaillierte 
                Fahrzeuginformationen, transparente Kostenaufstellungen und direkte Kommunikationsmöglichkeiten 
                schaffen Vertrauen und vermeiden Missverständnisse.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Vorteile für Käufer
              </h3>
              
              <p className="mb-4">
                Als Käufer profitieren Sie von einer <strong>breiten Auswahl an Fahrzeugen</strong> 
                verschiedenster Marken und Modelle. Sie können gezielt nach Ihrem Wunschauto suchen, 
                Konditionen vergleichen und das beste Angebot für sich finden. Die Übernahme eines 
                bestehenden Leasingvertrags ist oft günstiger als ein Neuleasing und ermöglicht Ihnen, 
                ein aktuelles Fahrzeug zu fahren, ohne sich langfristig zu binden.
              </p>

              <p className="mb-4">
                Zudem entfallen bei einer Leasingübernahme oft die hohen Anzahlungen, die bei einem 
                Neuvertrag fällig werden. Sie steigen einfach in einen laufenden Vertrag ein und 
                profitieren von den bereits ausgehandelten Konditionen. Alle relevanten Informationen 
                zum Fahrzeug und zum Leasingvertrag sind transparent auf BuyAuto.ch einsehbar.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Vorteile für Verkäufer
              </h3>
              
              <p className="mb-4">
                Als Verkäufer bietet Ihnen BuyAuto.ch die <strong>einfachste Möglichkeit</strong>, 
                Ihren Leasingvertrag abzugeben. Ob sich Ihre Lebensumstände geändert haben, Sie ein 
                anderes Fahrzeug benötigen oder die monatlichen Raten zur Belastung geworden sind – 
                auf unserer Plattform finden Sie schnell und unkompliziert einen Nachfolger für Ihr 
                Leasing.
              </p>

              <p className="mb-4">
                Die Inseratserstellung ist intuitiv und dauert nur wenige Minuten. Sie laden Fotos 
                hoch, beschreiben Ihr Fahrzeug und geben die Leasingkonditionen an. Potenzielle Käufer 
                können Sie direkt kontaktieren, und Sie behalten die volle Kontrolle über den Verkaufsprozess. 
                BuyAuto.ch nimmt Ihnen den administrativen Aufwand ab und unterstützt Sie bei der 
                Abwicklung der Vertragsübernahme.
              </p>

              <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                Warum BuyAuto.ch?
              </h3>
              
              <p className="mb-4">
                BuyAuto.ch kombiniert <strong>Benutzerfreundlichkeit mit höchsten Sicherheitsstandards</strong>. 
                Unsere Plattform ist speziell auf den Schweizer Markt zugeschnitten und berücksichtigt 
                die Besonderheiten des hiesigen Leasingmarktes. Mit Swiss Data Hosting garantieren wir, 
                dass Ihre Daten in der Schweiz bleiben und nach Schweizer Recht geschützt sind.
              </p>

              <p className="mb-4">
                Unser engagiertes Support-Team steht Ihnen bei Fragen jederzeit zur Verfügung. Wir 
                entwickeln unsere Plattform kontinuierlich weiter und hören auf das Feedback unserer 
                Nutzer, um Ihnen das bestmögliche Erlebnis zu bieten. Vertrauen Sie auf BuyAuto.ch – 
                Ihre erste Adresse für Leasingübernahmen in der Schweiz.
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