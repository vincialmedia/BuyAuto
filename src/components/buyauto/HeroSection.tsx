import SearchForm from "./SearchForm";
import Image from "next/image";

interface HeroSectionProps {
  totalListings: number;
}

export default function HeroSection({ totalListings }: HeroSectionProps) {
  return (
    <section className="relative min-h-[550px] md:min-h-[600px] flex flex-col justify-between overflow-hidden pt-16">
      {/* Background Image with Next.js Image - Mobile Optimized */}
      <div className="absolute inset-0">
        <Image
          src="/ChatGPT_Image_Oct_18_2025_05_36_15_PM.png"
          alt="Porsche driving on a mountain road"
          fill
          priority
          className="object-cover"
          sizes="100vw"
          quality={75}
        />
        {/* Swiss minimalist gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900/50 via-neutral-900/30 to-neutral-900/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-900/5 to-transparent" />
      </div>

      {/* Subtle geometric accent */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-1/5 w-64 h-64 bg-neutral-300/10 rounded-full blur-2xl" />

      {/* Hero Content - Upper Section */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Swiss typography hierarchy - more compact */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-light text-white mb-4 leading-[1.1] tracking-tight">
            Leasingübernahme in der Schweiz –{" "}
            <br className="hidden md:block" />
            <span className="font-semibold text-red-400">Einfach & Schnell</span>
          </h1>
          
          <p className="text-base md:text-xl text-neutral-200 mb-3 max-w-2xl mx-auto leading-relaxed font-light">
            Finde und übernimm deinen nächsten Auto-Leasingvertrag – schweizweit.
          </p>
          
          {/* Subtle statistics */}
          <p className="text-neutral-300 text-sm md:text-base font-medium tracking-wide">
            Aktuelle Inserate: <span className="text-white font-semibold">{totalListings.toLocaleString("de-CH")}</span>
          </p>
        </div>
      </div>

      {/* Search Form - Anchored at Bottom */}
      <div className="relative z-20 px-4 sm:px-6 lg:px-8 pb-8 md:pb-12">
        <div className="max-w-5xl mx-auto">
          <SearchForm />
        </div>
      </div>
    </section>
  );
}
