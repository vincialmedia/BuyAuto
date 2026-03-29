import Link from "next/link";
import { MapPin } from "lucide-react";

export function SeoCopyBlock() {
  const internalLinks = [
    { label: "Occasionen in der Schweiz", href: "/suche?deal_type=direct_purchase" },
    { label: "Auto Leasing in der Schweiz", href: "/suche?deal_type=leasing" },
    { label: "Auto-Abo in der Schweiz", href: "/suche?deal_type=auto_abo" },
    { label: "Leasingübernahme in der Schweiz", href: "/suche?deal_type=lease_takeover" },
    { label: "Fahrzeuge von Garagen", href: "/suche?seller_type=garage" },
    { label: "Alle Fahrzeuge", href: "/suche" },
  ];

  return (
    <section className="py-16 sm:py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        {/* Section header */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-100 text-neutral-600 text-sm font-medium mb-4">
            <MapPin className="w-4 h-4" />
            Auto kaufen Schweiz
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
            Auto kaufen in der Schweiz mit BuyAuto
          </h2>
        </div>
        
        {/* Body copy */}
        <div className="prose prose-lg max-w-none text-neutral-600 space-y-4">
          <p>
            Wer ein Auto in der Schweiz kaufen will, hat heute mehr Möglichkeiten denn je. Mit BuyAuto findest du Occasionen, Neuwagen, Leasingangebote, Auto-Abos und Leasingübernahmen auf einer Plattform – übersichtlich, modern und einfach vergleichbar.
          </p>

          <p>
            Egal ob du nach einer günstigen Occasion, einem Neuwagen, einem passenden Leasing oder einer flexiblen Alternative wie dem Auto-Abo suchst: BuyAuto bringt Angebote aus der ganzen Schweiz zusammen und macht den Weg zum nächsten Auto einfacher.
          </p>

          <p>
            Entdecke jetzt Fahrzeuge zum <strong>Kauf</strong>, <strong>Leasing</strong>, <strong>Auto-Abo</strong> oder zur <strong>Leasingübernahme</strong> – alles an einem Ort.
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