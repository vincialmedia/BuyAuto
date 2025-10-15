import { SearchForm } from "@/components/buyauto/SearchForm";
import { Button } from "@/components/ui/button";
import { Shield, Zap, TrendingDown, MapPin } from "lucide-react";
import Link from "next/link";

export function NewHeroSection() {
  return (
    <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/Screenshot_2025-09-18_at_14.53.15.png"
          alt="Auto Leasingübernahme Schweiz"
          className="w-full h-full object-cover opacity-30"
          width={1920}
          height={1080}
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/90 via-neutral-900/70 to-neutral-900/50" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="text-center mb-8 md:mb-12 space-y-6">
          {/* Main Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
            Auto Leasing Übernehmen oder Verkaufen{" "}
            <span className="block mt-2 bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              Einfach, Sicher und Schnell
            </span>
          </h1>

          {/* Subline */}
          <p className="text-base sm:text-lg md:text-xl text-neutral-300 max-w-3xl mx-auto leading-relaxed">
            BuyAuto.ch ist die Plattform für Leasingübernahmen in der Schweiz – transparent, schnell und ohne Stress.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-red-500 hover:bg-red-600 text-white h-14 px-8 rounded-xl font-semibold text-base shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/25 transition-all duration-200 hover:-translate-y-0.5"
            >
              <Link href="/suche">
                Durchsuche Angebote
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 h-14 px-8 rounded-xl font-semibold text-base transition-all duration-200 hover:-translate-y-0.5"
            >
              <Link href="/inserat-erstellen">
                Inserat erstellen
              </Link>
            </Button>
          </div>

          {/* Trust Row */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 pt-6 text-sm text-neutral-300">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-400" aria-hidden="true" />
              <span className="font-medium">Sichere Zahlung via Stripe</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-400" aria-hidden="true" />
              <span className="font-medium">Schweizer Plattform</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-red-400" aria-hidden="true" />
              <span className="font-medium">Schnelle Abwicklung</span>
            </div>
          </div>
        </div>

        {/* Docked Search Bar */}
        <div className="mt-8 md:mt-12">
          <SearchForm />
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </section>
  );
}