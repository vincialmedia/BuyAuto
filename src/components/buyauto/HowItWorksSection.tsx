
import { Button } from "@/components/ui/button";
import { Search, FileCheck, Car } from "lucide-react";
import Link from "next/link";

const steps = [
  {
    icon: Search,
    step: "1",
    title: "Suche & wähle",
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
    <section id="funktioniert" className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Swiss clean section header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-light text-neutral-900 mb-3 tracking-tight">
            So <span className="font-semibold text-red-500">funktioniert's</span>
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto font-light leading-relaxed">
            In nur 3 einfachen Schritten zu deinem neuen Leasingfahrzeug
          </p>
        </div>

        {/* Swiss refined step cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="relative text-center group">
                {/* Swiss connecting line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-full w-full h-px bg-gradient-to-r from-neutral-300 via-neutral-200 to-transparent transform translate-x-6 translate-y-px" />
                )}
                
                {/* Swiss minimalist icon container */}
                <div className="relative mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-red-500/20 group-hover:shadow-xl group-hover:shadow-red-500/30 transition-all duration-300 group-hover:-translate-y-1">
                  <IconComponent className="h-7 w-7 text-white" />
                  
                  {/* Step number badge */}
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-neutral-900 text-white rounded-full flex items-center justify-center text-xs font-semibold shadow-lg">
                    {step.step}
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-neutral-900 mb-3 leading-tight">
                  {step.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed font-light">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Swiss minimal CTA */}
        <div className="text-center mt-16">
          <Link href="/suche">
            <Button 
              size="lg"
              className="bg-red-500 hover:bg-red-600 text-white px-8 font-medium rounded-2xl shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/25 transition-all duration-200 hover:-translate-y-0.5"
            >
              Jetzt Fahrzeuge entdecken
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}