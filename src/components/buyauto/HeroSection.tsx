import SearchForm from "./SearchForm";
import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="relative min-h-[550px] md:min-h-[600px] flex flex-col justify-between overflow-hidden pt-16 md:pt-20">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/ChatGPT_Image_Oct_18_2025_05_36_15_PM.png"
          alt="Porsche driving on a mountain road"
          fill
          className="object-cover"
          priority
          sizes="100vw"
          quality={75}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
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
