import SearchForm from "./SearchForm";
import Image from "next/image";
import { Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative min-h-[700px] flex items-center overflow-hidden pt-16">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0">
        {/* Hero Image */}
        <div className="absolute inset-0">
          <Image
            src="/ChatGPT_Image_Oct_18_2025_05_36_15_PM.png"
            alt="Porsche driving on a mountain road"
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
        </div>
        
        {/* Gradient Overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        
        {/* Decorative mesh gradients */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
        </div>
      </div>

      {/* Hero Content - Center Aligned */}
      <div className="relative z-10 w-full px-4 py-20">
        <div className="max-w-6xl mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/20 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-primary/30 backdrop-blur-sm">
              <Sparkles className="w-4 h-4" />
              Die Schweizer Plattform
            </div>
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] mb-6 break-words">
              Leasingübernahme<br />
              <span className="text-primary">Einfach & Schnell</span>
            </h1>
            <p className="text-lg md:text-2xl text-neutral-200 font-medium mb-8 leading-relaxed px-2">
              Finde und übernimm deinen nächsten Auto-Leasingvertrag – schweizweit.
            </p>
            
            {/* Search Form */}
            <div className="mt-8">
              <SearchForm variant="hero" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}