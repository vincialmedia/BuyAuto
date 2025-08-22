import { Button } from "@/components/ui/button";
import { Search, FileCheck, Car } from "lucide-react";

const steps = [
  {
    icon: Search,
    step: "1",
    title: "Suche & wähle Fahrzeug",
    description: "Durchsuche unsere Fahrzeugdatenbank und finde das perfekte Auto für deine Bedürfnisse."
  },
  {
    icon: FileCheck,
    step: "2", 
    title: "Anfrage & Kreditcheck",
    description: "Stelle eine unverbindliche Anfrage und lass deine Bonität binnen 24 Stunden prüfen."
  },
  {
    icon: Car,
    step: "3",
    title: "Übernahme & Übergabe", 
    description: "Nach erfolgreicher Prüfung übernimmst du den Leasingvertrag und erhältst dein Fahrzeug."
  }
];

export default function HowItWorksSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            So funktioniert's
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            In nur 3 einfachen Schritten zu deinem neuen Leasingfahrzeug
          </p>
        </div>

        <div className="space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-slate-300 to-transparent transform translate-x-4" />
                )}
                
                <div className="text-center lg:text-left">
                  {/* Icon Container */}
                  <div className="relative mx-auto lg:mx-0 w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                    <IconComponent className="h-8 w-8 text-white" />
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {step.step}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Button */}
        <div className="text-center mt-12">
          <Button 
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white px-8"
          >
            Jetzt Fahrzeuge entdecken
          </Button>
        </div>
      </div>
    </section>
  );
}