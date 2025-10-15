import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function SeoCopySection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const transitionClass = prefersReducedMotion ? "" : "transition-all duration-200";

  return (
    <section className="py-16 md:py-24 bg-white" aria-labelledby="about-heading">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <article className="prose prose-neutral max-w-none">
          <h2 id="about-heading" className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">
            Über BuyAuto.ch
          </h2>

          <div className="space-y-4 text-neutral-700 leading-relaxed">
            <p>
              BuyAuto.ch ist die führende Plattform für <strong>Leasingübernahmen in der Schweiz</strong>. 
              Wir verbinden Autobesitzer, die ihr Leasing vorzeitig beenden möchten, mit Interessenten, 
              die von attraktiven Konditionen profitieren wollen – ohne hohe Anzahlungen oder lange Wartezeiten.
            </p>

            <p>
              Unser Ziel ist es, den Prozess der <strong>Leasingübernahme</strong> so einfach, transparent 
              und sicher wie möglich zu gestalten. Ob du ein Auto suchst oder dein bestehendes Leasing 
              verkaufen möchtest: BuyAuto.ch bietet dir die ideale Plattform dafür.
            </p>

            <div 
              className={`${prefersReducedMotion ? "" : "transition-all duration-300"} ${isExpanded ? "block" : "hidden"}`}
              id="expanded-content"
              aria-hidden={!isExpanded}
            >
              <h3 className="text-2xl font-semibold text-neutral-900 mt-8 mb-4">
                Vorteile für Käufer
              </h3>
              <p>
                Als Käufer profitierst du bei BuyAuto.ch von einer grossen Auswahl an aktuellen Leasingangeboten. 
                Du kannst verschiedene Marken und Modelle vergleichen, die{" "}
                <Link href="/suche" className="text-red-600 hover:underline font-medium">
                  Restlaufzeit und monatlichen Raten
                </Link>{" "}
                prüfen und direkt mit den Anbietern in Kontakt treten. Oft sind bei Leasingübernahmen 
                keine oder nur geringe Anzahlungen erforderlich, was den Einstieg besonders attraktiv macht.
              </p>

              <h3 className="text-2xl font-semibold text-neutral-900 mt-8 mb-4">
                Vorteile für Verkäufer
              </h3>
              <p>
                Wenn du dein Leasing vorzeitig beenden möchtest, bietet dir BuyAuto.ch eine einfache Lösung. 
                Erstelle in wenigen Minuten ein{" "}
                <Link href="/inserat-erstellen" className="text-red-600 hover:underline font-medium">
                  kostenloses Inserat
                </Link>{" "}
                und erreiche tausende potenzielle Interessenten in der ganzen Schweiz. So vermeidest du 
                teure Vorzeitigkeitsgebühren und kannst flexibel auf neue Lebensumstände reagieren.
              </p>

              <h3 className="text-2xl font-semibold text-neutral-900 mt-8 mb-4">
                Sicherheit und Transparenz
              </h3>
              <p>
                Bei BuyAuto.ch steht Sicherheit an erster Stelle. Alle Zahlungen werden über{" "}
                <strong>Stripe</strong> abgewickelt, eine der weltweit führenden und sichersten 
                Zahlungsplattformen. Deine Daten bleiben in der Schweiz und werden nach höchsten 
                Datenschutzstandards (DSGVO) verarbeitet.
              </p>

              <h3 className="text-2xl font-semibold text-neutral-900 mt-8 mb-4">
                So funktioniert's
              </h3>
              <p>
                Der Ablauf ist denkbar einfach: Durchsuche unsere aktuellen Angebote, finde das passende 
                Auto und kontaktiere den Anbieter direkt über die Plattform. Nach einer kurzen Absprache 
                könnt ihr die Leasingübernahme gemeinsam mit der Leasinggesellschaft abwickeln. BuyAuto.ch 
                begleitet dich während des gesamten Prozesses und sorgt für einen reibungslosen Ablauf.
              </p>

              <p className="text-sm text-neutral-600 mt-8 pt-6 border-t border-neutral-200">
                <strong>Häufig gestellte Fragen:</strong> Was ist eine Leasingübernahme? Wie funktioniert 
                der Transfer eines Autoleasings? Welche Kosten fallen an? Alle Antworten findest du in 
                unserem FAQ-Bereich oder kontaktiere uns direkt für persönliche Unterstützung.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className={`inline-flex items-center gap-2 h-11 px-6 rounded-xl font-medium border-neutral-300 hover:border-neutral-400 ${transitionClass}`}
              aria-expanded={isExpanded}
              aria-controls="expanded-content"
            >
              {isExpanded ? "Weniger anzeigen" : "Mehr erfahren"}
              <ChevronDown
                className={`h-4 w-4 ${prefersReducedMotion ? "" : "transition-transform duration-200"} ${
                  isExpanded ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </Button>
          </div>
        </article>
      </div>
    </section>
  );
}
