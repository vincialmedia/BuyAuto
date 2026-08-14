import { 
  Search, 
  Building2, 
  Check,
  ArrowRight,
  Car,
  PenLine
} from "lucide-react";
import Link from "next/link";
import { HoverTooltip } from "@/components/ui/hover-tooltip";

export function BuyerGarageSection() {
  return (
    <section className="relative py-16 sm:py-20 bg-white overflow-hidden">
      {/* Subtle background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neutral-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight mb-4">
            Fahrzeuge von Garagen und Privatpersonen
          </h2>
          <p className="text-lg sm:text-xl text-neutral-600 max-w-2xl mx-auto">
            Jedes Übernahme-Inserat weist Monatsrate und Restlaufzeit transparent aus – und die Übertragung läuft immer über die Leasinggesellschaft.
          </p>
        </div>

        {/* Two Column Cards */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          
          {/* Left Card - Für Käufer */}
          <div className="group relative bg-neutral-50 rounded-3xl p-8 lg:p-10 border border-neutral-200 hover:border-neutral-300 transition-all duration-500 hover:shadow-xl hover:-translate-y-1">
            {/* Hover glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Corner decoration */}
            <div className="absolute top-6 right-6 w-20 h-20 bg-red-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
            
            <div className="relative">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-neutral-200 shadow-sm mb-6 group-hover:shadow-md group-hover:border-red-200 transition-all duration-300">
                <Search className="w-7 h-7 text-neutral-700 group-hover:text-red-500 transition-colors duration-300" />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                Für Übernehmer
              </h3>

              {/* Description */}
              <p className="text-neutral-600 mb-6 leading-relaxed">
                Entdecke Leasingübernahmen von Schweizer Garagen und privaten Anbietern – jedes Angebot mit klarer Monatsrate und Restlaufzeit.
              </p>

              {/* Bullet Points */}
              <ul className="space-y-3 mb-8">
                {["Monatsrate und Restlaufzeit in jedem Inserat", "Übertragung über die Leasinggesellschaft", "Direkter Kontakt zum Anbieter"].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 group/item">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center group-hover/item:bg-red-500/20 transition-colors duration-300">
                      <Check className="w-3.5 h-3.5 text-red-500" />
                    </span>
                    <span className="text-neutral-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link 
                href="/suche"
                className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white font-semibold rounded-xl hover:bg-neutral-800 transition-all duration-300 group/btn hover:shadow-lg hover:shadow-neutral-900/20"
              >
                <Car className="w-5 h-5" />
                Fahrzeuge entdecken
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </div>

          {/* Right Card - Für Verkäufer */}
          <div className="group relative bg-neutral-900 rounded-3xl p-8 lg:p-10 border border-neutral-800 hover:border-neutral-700 transition-all duration-500 hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-1">
            {/* Animated background glow */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
            </div>
            
            <div className="relative">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-sm mb-6 group-hover:bg-white/15 group-hover:border-red-500/30 transition-all duration-300">
                <Building2 className="w-7 h-7 text-white group-hover:text-red-400 transition-colors duration-300" />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-white mb-4">
                Für Abgeber
              </h3>

              {/* Description */}
              <p className="text-neutral-400 mb-6 leading-relaxed">
                Präsentiere dein Leasing oder deine Fahrzeuge dort, wo Menschen gezielt nach Leasingübernahmen suchen.
              </p>

              {/* Bullet Points */}
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 group/item">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center group-hover/item:bg-red-500/30 transition-colors duration-300">
                    <Check className="w-3.5 h-3.5 text-red-400" />
                  </span>
                  <span className="text-neutral-300 font-medium">Qualifizierte Anfragen</span>
                </li>
                
                <li className="flex items-center gap-3 group/item">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center group-hover/item:bg-red-500/30 transition-colors duration-300">
                    <Check className="w-3.5 h-3.5 text-red-400" />
                  </span>
                  <span className="text-neutral-300 font-medium flex items-center gap-1.5">
                    Eingebauter Chat
                    <HoverTooltip
                      side="top"
                      content={<p>Chat Daten in CH gespeichert</p>}
                      contentClassName="text-sm"
                    >
                      <button
                        type="button"
                        aria-label="Info: Eingebauter Chat"
                        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-help"
                      >
                        <span className="text-[10px] text-neutral-400">*</span>
                      </button>
                    </HoverTooltip>
                  </span>
                </li>
                
                <li className="flex items-center gap-3 group/item">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center group-hover/item:bg-red-500/30 transition-colors duration-300">
                    <Check className="w-3.5 h-3.5 text-red-400" />
                  </span>
                  <span className="text-neutral-300 font-medium">Mehr Sichtbarkeit</span>
                </li>
              </ul>

              {/* CTA Button */}
              <Link 
                href="/inserat-erstellen"
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all duration-300 group/btn hover:shadow-lg hover:shadow-red-500/30"
              >
                <PenLine className="w-5 h-5" />
                Jetzt Inserieren
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </div>

        </div>

        {/* Quiet B2B pointer */}
        <p className="mt-10 text-center text-sm text-neutral-600">
          Du bist eine Garage?{" "}
          <Link href="/fuer-garagen" className="text-red-600 font-semibold hover:underline">
            So nutzt du BuyAuto für deine Kunden
          </Link>
        </p>
      </div>
    </section>
  );
}

export default BuyerGarageSection;