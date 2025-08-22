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
    <section className="py-16 bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Warum BuyAuto?
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Wir machen Leasingübernahme einfach, sicher und transparent
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => {
            const IconComponent = benefit.icon;
            return (
              <div 
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 text-center group"
              >
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-red-200 transition-colors">
                  <IconComponent className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {benefit.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
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