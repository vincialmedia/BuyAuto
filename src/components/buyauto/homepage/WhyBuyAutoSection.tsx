import { Shield, TrendingDown, Zap, MapPin } from "lucide-react";
import { useEffect, useState } from "react";

export function WhyBuyAutoSection() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const features = [
    {
      icon: Shield,
      title: "Sichere Zahlungen",
      description: "Alle Transaktionen via Stripe verschlüsselt",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: TrendingDown,
      title: "Verlässliche Plattform",
      description: "Geprüfte Angebote und transparente Abwicklung",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: Zap,
      title: "Spare bei Übernahmen",
      description: "Günstigere Konditionen durch Leasingtransfer",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      icon: MapPin,
      title: "Schweizer Hosting",
      description: "Deine Daten bleiben in der Schweiz",
      color: "text-red-600",
      bgColor: "bg-red-50"
    }
  ];

  const transitionClass = prefersReducedMotion ? "" : "transition-all duration-300";

  return (
    <section className="py-16 md:py-24 bg-neutral-50" aria-labelledby="why-buyauto-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-16">
          <h2 id="why-buyauto-heading" className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Warum BuyAuto.ch?
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Die sicherste und einfachste Plattform für Leasingübernahmen in der Schweiz
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <article
              key={index}
              className={`group ${feature.bgColor} rounded-2xl p-6 text-center ${transitionClass} ${prefersReducedMotion ? "" : "hover:shadow-lg hover:-translate-y-1"}`}
              aria-labelledby={`feature-${index}-title`}
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 ${feature.bgColor} rounded-xl mb-4 ${transitionClass} ${prefersReducedMotion ? "" : "group-hover:scale-110"}`} aria-hidden="true">
                <feature.icon className={`h-8 w-8 ${feature.color}`} />
              </div>
              <h3 id={`feature-${index}-title`} className="text-xl font-bold text-neutral-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-neutral-600 leading-relaxed">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
