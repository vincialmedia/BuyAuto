import { CheckCircle, Clock, CreditCard, FileText } from "lucide-react";

const benefits = [
  {
    icon: CreditCard,
    title: "Übersichtliche Kosten",
    description: "Monatsrate, Restlaufzeit, Kilometer – alles transparent und leicht verständlich."
  },
  {
    icon: Clock,
    title: "Flexible Restlaufzeiten",
    description: "Von wenigen Monaten bis mehrere Jahre – finde die perfekte Laufzeit für dich."
  },
  {
    icon: CheckCircle,
    title: "Günstiger als Neu-Leasing",
    description: "Übernimm Verträge von Privatpersonen, die früher aussteigen wollen – oft mehrere Hundert Franken pro Monat günstiger."
  },
  {
    icon: FileText,
    title: "Direkter Kontakt zum Anbieter",
    description: "Ohne Zwischenhändler. Kommuniziere direkt mit der Person, die den Vertrag abgeben möchte."
  }
];

export default function BenefitsSection() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-neutral-50 to-white">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-neutral-900 mb-4 tracking-tight">
            Warum <span className="text-primary">BuyAuto</span>?
          </h2>
          <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Wir machen Leasingübernahme einfach, sicher und transparent
          </p>
        </div>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div 
                key={index}
                className="group bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl border-2 border-neutral-100 hover:border-primary/30 transition-all duration-300 text-center hover:-translate-y-1"
              >
                {/* Icon */}
                <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                  <IconComponent className="h-7 w-7 text-primary" />
                </div>
                
                <h3 className="text-xl font-black text-neutral-900 mb-3 leading-tight">
                  {benefit.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed text-base">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}