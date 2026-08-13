import {
  DoorOpen,
  Landmark,
  ConciergeBell,
  Wallet,
  CalendarClock,
  TrendingDown,
  Sparkles,
  LucideIcon
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ValueCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface CardGroup {
  heading: string;
  cards: ValueCard[];
}

const cardGroups: CardGroup[] = [
  {
    heading: "Du willst dein Leasing abgeben",
    cards: [
      {
        icon: DoorOpen,
        title: "Raus ohne Strafgebühren",
        description: "Keine teure Vertragsauflösung. Jemand übernimmt dein Leasing, du bist raus."
      },
      {
        icon: Landmark,
        title: "Bank-konform abgewickelt",
        description: "Wir führen dich durch die Übertragung, die deine Leasinggesellschaft akzeptiert."
      },
      {
        icon: ConciergeBell,
        title: "Kein Inserate-Stress",
        description: "Unser Concierge übernimmt alles, von der Bewerbung bis zur Übergabe."
      }
    ]
  },
  {
    heading: "Du suchst eine Übernahme",
    cards: [
      {
        icon: Wallet,
        title: "Keine Anzahlung nötig",
        description: "Steig in ein laufendes Leasing ein, ohne hohe Startkosten."
      },
      {
        icon: CalendarClock,
        title: "Kürzere Bindung",
        description: "Übernimm nur die Restlaufzeit statt 48 Monate neu zu unterschreiben."
      },
      {
        icon: TrendingDown,
        title: "Oft günstiger als neu",
        description: "Übernahmen haben häufig tiefere Raten als ein frischer Vertrag."
      }
    ]
  }
];

export function WhyBuyAutoSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      ref={sectionRef}
      className="relative py-16 sm:py-20 overflow-hidden"
    >
      {/* Subtle Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-neutral-50 to-white" />
      
      {/* Subtle Decorative Elements - Red/Neutral only */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "4s" }} />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-neutral-200/50 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "5s", animationDelay: "1s" }} />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div 
          className={`text-center mb-16 sm:mb-20 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-neutral-200/60 rounded-full px-5 py-2.5 mb-6 shadow-lg shadow-neutral-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-neutral-700 font-semibold text-sm tracking-wide">Warum BuyAuto?</span>
          </div>
          
          {/* Main Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 mb-6 tracking-tight max-w-4xl mx-auto leading-tight">
            Leasing übernehmen oder Leasing abgeben –{" "}
            <span className="text-red-500">
              ein Marktplatz für beide Seiten
            </span>
          </h2>

          {/* Supporting Text */}
          <p className="text-neutral-500 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            BuyAuto verbindet Menschen, die aus ihrem laufenden Leasingvertrag raus wollen, mit Menschen, die genau so einen Vertrag übernehmen möchten – ohne hohe Anzahlung, ohne Neuwagen-Wartezeit.
            <span className="text-neutral-700 font-medium"> Einfach, transparent und für die Schweiz gebaut.</span>
          </p>
        </div>

        {/* Value Card Groups */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {cardGroups.map((group, groupIndex) => (
            <div key={group.heading}>
              {/* Group Heading */}
              <h3
                className={`text-2xl sm:text-3xl font-bold text-neutral-900 mb-8 text-center transition-all duration-700 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${groupIndex * 100 + 200}ms` }}
              >
                {group.heading}
              </h3>

              {/* Cards */}
              <div className="grid grid-cols-1 gap-6 sm:gap-8">
                {group.cards.map((card, index) => {
                  const IconComponent = card.icon;
                  return (
                    <div
                      key={index}
                      className={`group relative transition-all duration-700 ${
                        isVisible
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-12"
                      }`}
                      style={{ transitionDelay: `${(groupIndex * 3 + index) * 100 + 300}ms` }}
                    >
                      {/* Card */}
                      <div className="relative h-full bg-white rounded-3xl p-7 sm:p-8 border border-neutral-200/80 shadow-lg shadow-neutral-200/40 hover:shadow-2xl hover:shadow-red-500/10 transition-all duration-500 hover:-translate-y-2 hover:border-red-200 overflow-hidden">

                        {/* Hover Gradient Overlay - Red tint */}
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 rounded-3xl" />

                        {/* Animated Corner Accent */}
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:opacity-100 group-hover:scale-150 transition-all duration-700 opacity-0" />

                        {/* Icon Container */}
                        <div className="relative mb-6">
                          <div className="w-14 h-14 bg-neutral-900 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-red-500 transition-all duration-500">
                            <IconComponent className="h-7 w-7 text-white" strokeWidth={2} />
                          </div>
                          {/* Icon Glow on hover */}
                          <div className="absolute inset-0 w-14 h-14 bg-red-500 rounded-2xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
                        </div>

                        {/* Title */}
                        <h3 className="relative text-xl font-bold text-neutral-900 mb-3 leading-snug group-hover:text-neutral-800 transition-colors">
                          {card.title}
                        </h3>

                        {/* Description */}
                        <p className="relative text-neutral-500 text-base leading-relaxed group-hover:text-neutral-600 transition-colors">
                          {card.description}
                        </p>

                        {/* Bottom Accent Line - Red */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-b-3xl" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Decorative Element */}
        <div 
          className={`flex justify-center mt-12 transition-all duration-1000 delay-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex items-center gap-2 text-neutral-400">
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
            <Sparkles className="h-4 w-4 text-red-400 animate-pulse" />
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhyBuyAutoSection;