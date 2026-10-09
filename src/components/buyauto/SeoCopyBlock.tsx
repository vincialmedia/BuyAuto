import Link from "next/link";
import { Repeat } from "lucide-react";
import { CANTONAL_FEES_HREF } from "@/lib/buyauto/facts";

export function SeoCopyBlock() {
  const internalLinks = [
    { label: "Leasingübernahme in der Schweiz", href: "/leasinguebernahme" },
    { label: "Leasing abgeben in der Schweiz", href: "/leasing-abgeben-schweiz" },
    { label: "Was kostet eine Leasingübernahme?", href: "/leasinguebernahme-kosten" },
    { label: "Leasingvertrag übertragen", href: "/leasingvertrag-uebertragen" },
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
            Leasingübernahme in der Schweiz: was sie ist und was sie kostet
          </h2>
        </div>

        {/* Body copy */}
        <div className="prose prose-lg max-w-none text-neutral-600 space-y-4">
          <p>
            Eine{" "}
            <Link href="/leasinguebernahme" className="text-red-600 font-semibold hover:underline">
              Leasingübernahme
            </Link>{" "}
            bedeutet: Du übernimmst einen laufenden Leasingvertrag mit Monatsrate, Restlaufzeit und Kilometerlimit von der bisherigen Leasingnehmerin oder dem bisherigen Leasingnehmer.
          </p>

          <p>
            Für Abgeber ist die Übernahme eine Alternative zur{" "}
            <Link href="/leasing-abgeben-schweiz" className="text-red-600 font-semibold hover:underline">
              vorzeitigen Vertragsauflösung
            </Link>
            . Dabei fallen die{" "}
            <Link href="/leasinguebernahme-kosten#leasinggesellschaften" className="text-red-600 font-semibold hover:underline">
              Gebühr der Leasinggesellschaft
            </Link>{" "}
            für die Übertragung und die{" "}
            <Link href={CANTONAL_FEES_HREF} className="text-red-600 font-semibold hover:underline">
              kantonale Gebühr für den neuen Fahrzeugausweis
            </Link>{" "}
            an.
          </p>

          <p>
            BuyAuto ist ein Schweizer Marktplatz für Leasingübernahmen von Privatpersonen und Garagen. In den Inseraten stehen die Vertragsdaten, die der Abgeber angibt, und du nimmst direkt mit dem Anbieter Kontakt auf. Neben Leasingübernahmen findest du auf BuyAuto auch Fahrzeuge zum <strong>Direktkauf</strong>.
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
