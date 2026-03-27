import { 
  Car, 
  BarChart3, 
  MessageSquare, 
  MapPin, 
  Eye, 
  Sparkles 
} from "lucide-react";

const valueCards = [
  {
    icon: Car,
    title: "Alle Wege zum Auto an einem Ort",
    description: "Kauf, Leasing, Auto-Abo und Leasingübernahme – alles auf einer Plattform."
  },
  {
    icon: BarChart3,
    title: "Einfach vergleichen",
    description: "Vergleiche Preise, Laufzeiten und Angebote schneller und übersichtlicher."
  },
  {
    icon: MessageSquare,
    title: "Direkter Kontakt",
    description: "Kommuniziere direkt mit Anbietern und Garagen – ohne unnötige Umwege."
  },
  {
    icon: MapPin,
    title: "Für die Schweiz gebaut",
    description: "Relevante Angebote aus der ganzen Schweiz, passend für den Schweizer Markt."
  },
  {
    icon: Eye,
    title: "Mehr Transparenz",
    description: "Klare Angaben statt komplizierter Prozesse und unübersichtlicher Plattformen."
  },
  {
    icon: Sparkles,
    title: "Moderne Tools",
    description: "Strukturierte Inserate, bessere Übersicht und ein einfacher Deal-Prozess."
  }
];

export function WhyBuyAutoSection() {
  return (
    <section className="py-20 sm:py-24 bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-white border border-neutral-200 rounded-full px-5 py-2 mb-5 shadow-sm">
            <span className="text-neutral-600 font-medium text-sm">Warum BuyAuto?</span>
          </div>
          
          {/* Main Headline */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-4 tracking-tight max-w-3xl mx-auto">
            Alles, was du für dein nächstes Auto brauchst – an einem Ort
          </h2>
          
          {/* Supporting Text */}
          <p className="text-neutral-500 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            BuyAuto bringt Kauf, Leasing, Auto-Abo und Leasingübernahme auf einer Plattform zusammen – einfach, modern und für die Schweiz gebaut.
          </p>
        </div>

        {/* Value Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {valueCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl p-6 sm:p-7 border border-neutral-200 shadow-sm hover:shadow-lg hover:border-neutral-300 transition-all duration-300 hover:-translate-y-0.5"
              >
                {/* Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-red-50 to-red-100/80 rounded-xl flex items-center justify-center mb-5 group-hover:shadow-md group-hover:shadow-red-100 transition-all duration-300">
                  <IconComponent className="h-5 w-5 text-red-500" />
                </div>
                
                {/* Title */}
                <h3 className="text-lg font-semibold text-neutral-900 mb-2 leading-snug">
                  {card.title}
                </h3>
                
                {/* Description */}
                <p className="text-neutral-500 text-sm leading-relaxed">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default WhyBuyAutoSection;