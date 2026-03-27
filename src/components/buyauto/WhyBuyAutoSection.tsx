import { 
  Car, 
  BarChart3, 
  MessageSquare, 
  MapPin, 
  Eye, 
  Sparkles,
  LucideIcon
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ValueCard {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
  iconBg: string;
  accentColor: string;
}

const valueCards: ValueCard[] = [
  {
    icon: Car,
    title: "Alle Wege zum Auto an einem Ort",
    description: "Kauf, Leasing, Auto-Abo und Leasingübernahme – alles auf einer Plattform.",
    gradient: "from-red-500 to-orange-500",
    iconBg: "bg-gradient-to-br from-red-500 to-orange-500",
    accentColor: "group-hover:shadow-red-500/25"
  },
  {
    icon: BarChart3,
    title: "Einfach vergleichen",
    description: "Vergleiche Preise, Laufzeiten und Angebote schneller und übersichtlicher.",
    gradient: "from-blue-500 to-cyan-500",
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-500",
    accentColor: "group-hover:shadow-blue-500/25"
  },
  {
    icon: MessageSquare,
    title: "Direkter Kontakt",
    description: "Kommuniziere direkt mit Anbietern und Garagen – ohne unnötige Umwege.",
    gradient: "from-emerald-500 to-teal-500",
    iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500",
    accentColor: "group-hover:shadow-emerald-500/25"
  },
  {
    icon: MapPin,
    title: "Für die Schweiz gebaut",
    description: "Relevante Angebote aus der ganzen Schweiz, passend für den Schweizer Markt.",
    gradient: "from-violet-500 to-purple-500",
    iconBg: "bg-gradient-to-br from-violet-500 to-purple-500",
    accentColor: "group-hover:shadow-violet-500/25"
  },
  {
    icon: Eye,
    title: "Mehr Transparenz",
    description: "Klare Angaben statt komplizierter Prozesse und unübersichtlicher Plattformen.",
    gradient: "from-amber-500 to-yellow-500",
    iconBg: "bg-gradient-to-br from-amber-500 to-yellow-500",
    accentColor: "group-hover:shadow-amber-500/25"
  },
  {
    icon: Sparkles,
    title: "Moderne Tools",
    description: "Strukturierte Inserate, bessere Übersicht und ein einfacher Deal-Prozess.",
    gradient: "from-pink-500 to-rose-500",
    iconBg: "bg-gradient-to-br from-pink-500 to-rose-500",
    accentColor: "group-hover:shadow-pink-500/25"
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
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-neutral-50 to-white" />
      
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-red-500/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/3 to-pink-500/3 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div 
          className={`text-center mb-16 sm:mb-20 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Animated Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-neutral-200/60 rounded-full px-5 py-2.5 mb-6 shadow-lg shadow-neutral-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-neutral-700 font-semibold text-sm tracking-wide">Warum BuyAuto?</span>
          </div>
          
          {/* Main Headline with Gradient */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 mb-6 tracking-tight max-w-4xl mx-auto leading-tight">
            Alles, was du für dein nächstes Auto brauchst –{" "}
            <span className="bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 bg-clip-text text-transparent">
              an einem Ort
            </span>
          </h2>
          
          {/* Supporting Text */}
          <p className="text-neutral-500 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            BuyAuto bringt Kauf, Leasing, Auto-Abo und Leasingübernahme auf einer Plattform zusammen – 
            <span className="text-neutral-700 font-medium"> einfach, modern und für die Schweiz gebaut.</span>
          </p>
        </div>

        {/* Value Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {valueCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <div
                key={index}
                className={`group relative transition-all duration-700 ${
                  isVisible 
                    ? "opacity-100 translate-y-0" 
                    : "opacity-0 translate-y-12"
                }`}
                style={{ transitionDelay: `${index * 100 + 200}ms` }}
              >
                {/* Card */}
                <div className={`relative h-full bg-white rounded-3xl p-7 sm:p-8 border border-neutral-200/80 shadow-lg shadow-neutral-200/40 hover:shadow-2xl ${card.accentColor} transition-all duration-500 hover:-translate-y-2 hover:border-neutral-300/80 overflow-hidden`}>
                  
                  {/* Hover Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 rounded-3xl`} />
                  
                  {/* Animated Corner Accent */}
                  <div className={`absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br ${card.gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 group-hover:scale-150 transition-all duration-700`} />
                  
                  {/* Icon Container */}
                  <div className="relative mb-6">
                    <div className={`w-14 h-14 ${card.iconBg} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                      <IconComponent className="h-7 w-7 text-white" strokeWidth={2} />
                    </div>
                    {/* Icon Glow */}
                    <div className={`absolute inset-0 w-14 h-14 ${card.iconBg} rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />
                  </div>
                  
                  {/* Title */}
                  <h3 className="relative text-xl font-bold text-neutral-900 mb-3 leading-snug group-hover:text-neutral-800 transition-colors">
                    {card.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="relative text-neutral-500 text-base leading-relaxed group-hover:text-neutral-600 transition-colors">
                    {card.description}
                  </p>
                  
                  {/* Bottom Accent Line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-b-3xl`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Decorative Element */}
        <div 
          className={`flex justify-center mt-16 transition-all duration-1000 delay-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex items-center gap-2 text-neutral-400">
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
            <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhyBuyAutoSection;