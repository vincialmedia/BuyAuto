
import SearchForm from "./SearchForm";

interface HeroSectionProps {
  totalListings: number;
}

export default function HeroSection({ totalListings }: HeroSectionProps) {
  return (
    <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Refined Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1920&h=1080&fit=crop&crop=center')`
        }}
      >
        {/* Swiss minimalist gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/75 via-neutral-900/60 to-neutral-900/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-900/10 to-transparent" />
      </div>

      {/* Subtle geometric accent */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-1/5 w-64 h-64 bg-neutral-300/10 rounded-full blur-2xl" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Swiss typography hierarchy */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-light text-white mb-8 leading-[1.1] tracking-tight">
            Leasingübernahme in der Schweiz –{" "}
            <br className="hidden md:block" />
            <span className="font-semibold text-red-400">Einfach & Schnell</span>
          </h1>
          
          <p className="text-lg md:text-xl text-neutral-200 mb-4 max-w-2xl mx-auto leading-relaxed font-light">
            Finde und übernimm deinen nächsten Auto-Leasingvertrag – schweizweit.
          </p>
          
          {/* Subtle statistics */}
          <p className="text-neutral-300 text-sm font-medium tracking-wide">
            Aktuelle Inserate: <span className="text-white font-semibold">{totalListings.toLocaleString("de-CH")}</span>
          </p>
        </div>

        {/* Search Form with better spacing */}
        <div className="mb-16">
          <SearchForm />
        </div>

        {/* Minimal scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="w-px h-12 bg-gradient-to-b from-neutral-400/60 to-transparent" />
          <div className="w-1 h-1 bg-neutral-400/60 rounded-full mx-auto mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
