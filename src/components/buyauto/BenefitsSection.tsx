
import { CheckCircle, Clock, CreditCard, FileText } from "lucide-react";

const benefits = [
  {
    icon: CreditCard,
    title: "Keine Vorabzahlung nötig",
    description: "Starte sofort ohne grosse Anfangsinvestition in dein neues Fahrzeug."
  },
  {
    icon: Clock,
    title: "Flexible Restlaufzeiten",
    description: "Von wenigen Monaten bis mehrere Jahre – finde die perfekte Laufzeit für dich."
  },
  {
    icon: CheckCircle,
    title: "Schnelle Kreditprüfung",
    description: "Erhalte binnen 24 Stunden eine verbindliche Zusage für deine Leasingübernahme."
  },
  {
    icon: FileText,
    title: "Transparente Kostenübersicht",
    description: "Alle Kosten klar aufgeschlüsselt – keine versteckten Gebühren oder Überraschungen."
  }
];

export default function BenefitsSection() {
  return (
    <section className="py-20 bg-gradient-to-br from-neutral-50 via-white to-neutral-50/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Swiss clean section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-light text-neutral-900 mb-4 tracking-tight">
            Warum <span className="font-semibold text-red-500">BuyAuto</span>?
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto font-light leading-relaxed">
            Wir machen Leasingübernahme einfach, sicher und transparent
          </p>
        </div>

        {/* Swiss grid with refined cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div 
                key={index}
                className="group bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm hover:shadow-xl border border-neutral-200/40 hover:border-neutral-300/60 transition-all duration-500 text-center hover:-translate-y-1"
              >
                {/* Swiss minimal icon treatment */}
                <div className="w-14 h-14 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:shadow-lg group-hover:shadow-red-500/10 transition-all duration-300">
                  <IconComponent className="h-6 w-6 text-red-500" />
                </div>
                
                <h3 className="text-lg font-semibold text-neutral-900 mb-3 leading-tight">
                  {benefit.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed font-light text-sm">
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
