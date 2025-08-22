import SearchForm from "./SearchForm";

interface HeroSectionProps {
  totalListings: number;
}

export default function HeroSection({ totalListings }: HeroSectionProps) {
  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1920&h=1080&fit=crop&crop=center')`
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-slate-900/50 to-slate-900/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
          Leasingübernahme in der Schweiz –{" "}
          <span className="text-red-400">Einfach & Schnell</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-slate-200 mb-12 max-w-3xl mx-auto leading-relaxed">
          Finde und übernimm deinen nächsten Auto-Leasingvertrag – schweizweit.
        </p>

        {/* Search Form */}
        <div className="mb-8">
          <SearchForm />
        </div>

        {/* Listing Count */}
        <p className="text-slate-300 text-sm">
          Aktuelle Inserate: <span className="font-semibold text-white">{totalListings.toLocaleString("de-CH")}</span>
        </p>
      </div>
    </section>
  );
}