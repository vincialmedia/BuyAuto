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
    title: "Anfrage & Inspektion",
    description: "Stelle eine unverbindliche Anfrage und besichtige das Fahrzeug."
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
    <section id="funktioniert" className="py-20 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-neutral-900 mb-4 tracking-tight">
            So <span className="text-primary">funktioniert's</span>
          </h2>
          <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            In nur 3 einfachen Schritten zu deinem neuen Leasingfahrzeug
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="relative">
                <div className="flex items-start gap-6 md:gap-8">
                  <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-primary to-primary/80 text-white flex flex-col items-center justify-center font-black text-2xl shadow-xl ring-4 ring-primary/20">
                    {step.step}
                  </div>
                  
                  <div className="flex-1 bg-white rounded-3xl p-8 border-2 border-neutral-100 hover:border-primary/30 transition-all duration-300 hover:shadow-lg group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-primary/10 p-2 rounded-xl group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-2xl font-black text-neutral-900">{step.title}</h3>
                    </div>
                    <p className="text-neutral-600 text-lg leading-relaxed">{step.description}</p>
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div className="ml-10 my-4 h-8 w-1 bg-gradient-to-b from-primary/30 to-transparent rounded-full" />
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Link href="/inserat-erstellen">
            <Button 
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white font-bold px-10 py-7 text-lg rounded-2xl shadow-xl shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              Jetzt Inserat erstellen
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}