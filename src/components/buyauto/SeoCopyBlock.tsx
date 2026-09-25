import Link from "next/link";
import { Repeat } from "lucide-react";
import { T, useT } from "@/i18n/runtime";

export function SeoCopyBlock() {
  const t = useT();
  const internalLinks = [
    { label: "Leasingübernahme in der Schweiz", href: "/leasinguebernahme" },
    { label: "Leasing abgeben in der Schweiz", href: "/leasing-abgeben-schweiz" },
    { label: "Was kostet eine Leasingübernahme?", href: "/leasinguebernahme-kosten" },
    { label: "Leasingvertrag übertragen", href: "/leasingvertrag-uebertragen" },
    { label: "Aktuelle Leasingübernahme-Angebote", href: "/suche?dealType=lease_takeover" },
  ];

  return (
    <section className="py-16 sm:py-20 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        {/* Section header */}
        <div className="mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-100 text-neutral-600 text-sm font-medium mb-4">
            <Repeat className="w-4 h-4" />
            {t("Leasingübernahme Schweiz")}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 tracking-tight">
            {t("Leasingübernahme in der Schweiz – so funktioniert BuyAuto")}
          </h2>
        </div>

        {/* Body copy */}
        <div className="prose prose-lg max-w-none text-neutral-600 space-y-4">
          <p>
            <T
              k="Eine <0>Leasingübernahme</0> bedeutet: Du übernimmst einen laufenden Leasingvertrag – inklusive Monatsrate, Restlaufzeit und Kilometerlimit – und die bisherige Leasingnehmerin oder der bisherige Leasingnehmer wird aus dem Vertrag entlassen."
              c={[<Link key="0" href="/leasinguebernahme" className="text-red-600 font-semibold hover:underline" />]}
            />
          </p>

          <p>
            <T
              k="Für Abgeber entfällt damit die <0>teure vorzeitige Vertragsauflösung</0> – statt einer Auflösungsentschädigung fällt nur die <1>Umschreibegebühr der Leasinggesellschaft</1> an. Für Übernehmer heisst es: fahren ohne hohe Anzahlung und mit kurzer Restlaufzeit."
              c={[
                <Link key="0" href="/leasing-abgeben-schweiz" className="text-red-600 font-semibold hover:underline" />,
                <Link key="1" href="/leasinguebernahme-kosten" className="text-red-600 font-semibold hover:underline" />,
              ]}
            />
          </p>

          <p>
            <T
              k="BuyAuto ist ein Schweizer Marktplatz für Leasingübernahmen – für Privatpersonen und Garagen. Die Inserate weisen Monatsrate und Restlaufzeit transparent aus, und du stehst direkt mit dem Anbieter in Kontakt. Neben Leasingübernahmen findest du auf BuyAuto auch ausgewählte Fahrzeuge zum <0>Direktkauf</0>."
              c={[<strong key="0" />]}
            />
          </p>
        </div>

        {/* Internal links */}
        <div className="mt-10 pt-8 border-t border-neutral-200">
          <p className="text-sm font-medium text-neutral-500 mb-4">{t("Entdecke mehr auf BuyAuto:")}</p>
          <div className="flex flex-wrap gap-3">
            {internalLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="inline-flex items-center px-4 py-2 rounded-full bg-neutral-100 text-neutral-700 text-sm font-medium hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
              >
                {t(link.label)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
