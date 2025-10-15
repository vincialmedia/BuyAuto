import { Shield, Users, TrendingDown, Database } from "lucide-react";

const benefits = [
  {
    icon: Shield,
    title: "Sichere Zahlungen",
    description: "Alle Transaktionen werden über Stripe abgewickelt – sicher und transparent.",
  },
  {
    icon: Users,
    title: "Verlässliche Plattform",
    description: "Geprüfte Inserate und vertrauenswürdige Nutzer für sorgenfreie Leasingübernahmen.",
  },
  {
    icon: TrendingDown,
    title: "Spare bei Leasingübernahmen",
    description: "Profitiere von attraktiven Konditionen und vermeide hohe Anzahlungen.",
  },
  {
    icon: Database,
    title: "Schweizer Datenhosting",
    description: "Deine Daten bleiben in der Schweiz – DSGVO-konform und geschützt.",
  },
];

export function WhyBuyAutoSection() {
  return (
    <section className="py-16 md:py-24 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Warum BuyAuto.ch?
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Die vertrauenswürdige Plattform für Leasingübernahmen in der Schweiz
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-lg shadow-neutral-900/5 border border-neutral-200/50 hover:shadow-xl hover:shadow-neutral-900/10 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors duration-300">
                    <Icon className="h-7 w-7 text-red-500" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-neutral-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}