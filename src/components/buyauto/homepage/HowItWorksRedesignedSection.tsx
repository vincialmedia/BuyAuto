import { Search, MessageCircle, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

export function HowItWorksRedesignedSection() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const steps = [
    {
      number: "1",
      icon: Search,
      title: "Finde ein Angebot",
      description: "Durchsuche unsere Leasingangebote und finde das passende Fahrzeug für deine Bedürfnisse.",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      number: "2",
      icon: MessageCircle,
      title: "Kontaktiere den Anbieter",
      description: "Stelle deine Fragen direkt und kläre alle Details zur Leasingübernahme.",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      number: "3",
      icon: CheckCircle,
      title: "Übernehme das Leasing",
      description: "Schliesse die Übernahme sicher ab und freue dich auf dein neues Fahrzeug.",
      color: "text-red-600",
      bgColor: "bg-red-50"
    }
  ];

  const transitionClass = prefersReducedMotion ? "" : "transition-all duration-300";

  return (
    <section className="py-16 md:py-24 bg-white" aria-labelledby="how-it-works-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 id="how-it-works-heading" className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            So funktioniert die Leasingübernahme
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            In nur drei einfachen Schritten zu deinem neuen Leasing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <article
              key={index}
              className={`relative text-center ${transitionClass} ${prefersReducedMotion ? "" : "hover:-translate-y-2"}`}
              aria-labelledby={`step-${index}-title`}
            >
              {/* Connection Line (Desktop only) */}
              {index < steps.length - 1 && (
                <div 
                  className="hidden md:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-neutral-300 to-neutral-200"
                  aria-hidden="true"
                />
              )}

              {/* Step Number Badge */}
              <div 
                className={`relative inline-flex items-center justify-center w-24 h-24 ${step.bgColor} rounded-full mb-6 ${transitionClass} ${prefersReducedMotion ? "" : "group-hover:scale-110"}`}
                aria-hidden="true"
              >
                <div className="absolute inset-0 bg-white rounded-full m-3">
                  <step.icon className={`h-full w-full p-3 ${step.color}`} />
                </div>
                <span className={`absolute -bottom-2 -right-2 flex items-center justify-center w-10 h-10 ${step.color} bg-white rounded-full text-xl font-bold border-4 border-white shadow-lg`}>
                  {step.number}
                </span>
              </div>

              <h3 id={`step-${index}-title`} className="text-2xl font-bold text-neutral-900 mb-3">
                {step.title}
              </h3>
              <p className="text-neutral-600 leading-relaxed max-w-sm mx-auto">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
