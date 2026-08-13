import Link from "next/link";
import { Repeat } from "lucide-react";

export function SeoCopyBlock() {
  const internalLinks = [
    { label: "Leasingübernahme in der Schweiz", href: "/leasinguebernahme" },
    { label: "Leasing abgeben in der Schweiz", href: "/leasing-abgeben-schweiz" },
    { label: "Was kostet eine Leasingübernahme?", href: "/leasinguebernahme-kosten" },
    { label: "Leasing Concierge", href: "/leasing-concierge" },
    { label: "Aktuelle Leasingübernahme-Angebote", href: "/suche?dealType=lease_takeover" },
  ];

  return (
    <section className="py-16 sm:py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        {/* Section header */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-100 text-neutral-600 text-sm font-medium mb-4">
            <Repeat className="w-4 h-4" />
            Leasingübernahme Schweiz
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
            Leasingübernahme in der Schweiz – so funktioniert BuyAuto
          </h2>
        </div>

        {/* Body copy */}
        <div className="prose prose-lg max-w-none text-neutral-600 space-y-4">
          <p>
            Eine{" "}
            <Link href="/leasinguebernahme" className="text-red-600 font-semibold hover:underline">
              Leasingübernahme
            </Link>{" "}
            bedeutet: Du übernimmst einen laufenden Leasingvertrag – inklusive Monatsrate, Restlaufzeit und Kilometerlimit – und die bisherige Leasingnehmerin oder der bisherige Leasingnehmer wird aus dem Vertrag entlassen.
          </p>

          <p>
            Für Abgeber ist das oft{" "}
            <Link href="/leasing-abgeben-schweiz" className="text-red-600 font-semibold hover:underline">
              der günstigste legale Weg aus dem Leasing
            </Link>
            , weil die{" "}
            <Link href="/leasinguebernahme-kosten" className="text-red-600 font-semibold hover:underline">
              teure vorzeitige Vertragsauflösung
            </Link>{" "}
            entfällt. Für Übernehmer heisst es: fahren ohne hohe Anzahlung und mit kurzer Restlaufzeit.
          </p>

          <p>
            BuyAuto ist der Schweizer Marktplatz, der beide Seiten zusammenbringt – mit Inseraten, die Monatsrate und Restlaufzeit transparent ausweisen, und einem persönlichen{" "}
            <Link href="/leasing-concierge" className="text-red-600 font-semibold hover:underline">
              Concierge-Service
            </Link>{" "}
            für alle, die den Prozess nicht allein durchziehen wollen. Neben Leasingübernahmen findest du auf BuyAuto auch ausgewählte Fahrzeuge zum <strong>Direktkauf</strong>.
          </p>
        </div>

        {/* Internal links */}
        <div className="mt-10 pt-8 border-t border-neutral-200">
          <p className="text-sm font-medium text-neutral-500 mb-4">Entdecke mehr auf BuyAuto:</p>
          <div className="flex flex-wrap gap-3">
            {internalLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="inline-flex items-center px-4 py-2 rounded-full bg-neutral-100 text-neutral-700 text-sm font-medium hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
